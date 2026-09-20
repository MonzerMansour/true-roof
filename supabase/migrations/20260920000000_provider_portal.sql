-- Provider portal: org membership, access codes, draft listings.

alter table public.organizations
  add column if not exists description text,
  add column if not exists access_code text;

alter table public.listings
  add column if not exists published boolean not null default false;

update public.listings set published = true where published = false;

update public.organizations
set access_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where access_code is null;

alter table public.organizations
  alter column access_code set not null;

create unique index if not exists organizations_access_code_key
  on public.organizations (access_code);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('director', 'manager', 'staff')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_members_one_active
  on public.organization_members (organization_id, user_id)
  where status = 'active';

create unique index if not exists organization_members_one_pending
  on public.organization_members (organization_id, user_id)
  where status = 'pending';

create index if not exists organization_members_user_id
  on public.organization_members (user_id);

alter table public.organization_members enable row level security;

-- Helpers

create or replace function public.is_active_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_org_director(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'director'
  );
$$;

create or replace function public.can_manage_org(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('director', 'manager')
  );
$$;

create or replace function public.generate_access_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.organizations o where o.access_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

-- Organizations RLS

drop policy if exists "public read organizations" on public.organizations;

create policy "read organizations for published listings or members"
  on public.organizations for select to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.organization_id = organizations.id and l.published = true
    )
    or public.is_active_org_member(organizations.id)
  );

create policy "members update organizations"
  on public.organizations for update to authenticated
  using (public.can_manage_org(organizations.id))
  with check (public.can_manage_org(organizations.id));

-- Listings RLS

drop policy if exists "public read listings" on public.listings;

create policy "read published listings"
  on public.listings for select to anon, authenticated
  using (published = true);

create policy "members read org listings"
  on public.listings for select to authenticated
  using (public.is_active_org_member(organization_id));

create policy "managers insert listings"
  on public.listings for insert to authenticated
  with check (public.can_manage_org(organization_id));

create policy "members update org listings"
  on public.listings for update to authenticated
  using (public.is_active_org_member(organization_id))
  with check (public.is_active_org_member(organization_id));

-- Organization members RLS

drop policy if exists "read own membership" on public.organization_members;
create policy "read own membership"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "directors read org memberships" on public.organization_members;
create policy "directors read org memberships"
  on public.organization_members for select to authenticated
  using (public.is_org_director(organization_id));

drop policy if exists "directors update memberships" on public.organization_members;
create policy "directors update memberships"
  on public.organization_members for update to authenticated
  using (public.is_org_director(organization_id))
  with check (public.is_org_director(organization_id));

-- RPCs

create or replace function public.create_organization_with_site(
  p_org_name text,
  p_description text,
  p_site_name text,
  p_kind text,
  p_city text default 'San Jose'
)
returns table (organization_id uuid, listing_id uuid, access_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_org_id uuid := gen_random_uuid();
  v_listing_id uuid := gen_random_uuid();
  v_code text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_user_id;
  if v_role is distinct from 'provider' then
    raise exception 'Provider account required';
  end if;

  if trim(p_org_name) = '' or trim(p_site_name) = '' then
    raise exception 'Organization and site name are required';
  end if;

  if p_kind not in ('shelter', 'parking') then
    raise exception 'Invalid site kind';
  end if;

  v_code := public.generate_access_code();

  insert into public.organizations (id, name, description, access_code)
  values (v_org_id, trim(p_org_name), nullif(trim(p_description), ''), v_code);

  insert into public.listings (
    id, organization_id, name, kind, freshness, published, city
  )
  values (
    v_listing_id, v_org_id, trim(p_site_name), p_kind, 'call_first', false,
    coalesce(nullif(trim(p_city), ''), 'San Jose')
  );

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org_id, v_user_id, 'director', 'active');

  return query select v_org_id, v_listing_id, v_code;
end;
$$;

create or replace function public.request_join_organization(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_org_id uuid;
  v_member_id uuid;
  v_normalized text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_user_id;
  if v_role is distinct from 'provider' then
    raise exception 'Provider account required';
  end if;

  v_normalized := upper(trim(p_code));
  if v_normalized = '' then
    raise exception 'Access code is required';
  end if;

  select o.id into v_org_id
  from public.organizations o
  where o.access_code = v_normalized;

  if v_org_id is null then
    raise exception 'Invalid access code';
  end if;

  if exists (
    select 1 from public.organization_members m
    where m.organization_id = v_org_id
      and m.user_id = v_user_id
      and m.status = 'active'
  ) then
    raise exception 'You already belong to this organization';
  end if;

  if exists (
    select 1 from public.organization_members m
    where m.organization_id = v_org_id
      and m.user_id = v_user_id
      and m.status = 'pending'
  ) then
    raise exception 'Your request is already pending';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org_id, v_user_id, 'staff', 'pending')
  returning id into v_member_id;

  return v_member_id;
end;
$$;

create or replace function public.approve_member(
  p_member_id uuid,
  p_role text default 'staff'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if p_role not in ('staff', 'manager') then
    raise exception 'Invalid role for approval';
  end if;

  select m.organization_id into v_org_id
  from public.organization_members m
  where m.id = p_member_id and m.status = 'pending';

  if v_org_id is null then
    raise exception 'Pending membership not found';
  end if;

  if not public.is_org_director(v_org_id) then
    raise exception 'Only a director can approve members';
  end if;

  update public.organization_members
  set status = 'active', role = p_role, updated_at = now()
  where id = p_member_id;
end;
$$;

create or replace function public.reject_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select m.organization_id into v_org_id
  from public.organization_members m
  where m.id = p_member_id and m.status = 'pending';

  if v_org_id is null then
    raise exception 'Pending membership not found';
  end if;

  if not public.is_org_director(v_org_id) then
    raise exception 'Only a director can reject members';
  end if;

  update public.organization_members
  set status = 'rejected', updated_at = now()
  where id = p_member_id;
end;
$$;

create or replace function public.rotate_organization_access_code(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_org_director(p_org_id) then
    raise exception 'Only a director can rotate the access code';
  end if;

  v_code := public.generate_access_code();

  update public.organizations
  set access_code = v_code
  where id = p_org_id;

  return v_code;
end;
$$;

create or replace function public.get_organization_access_code(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_org_director(p_org_id) then
    raise exception 'Only a director can view the access code';
  end if;

  select o.access_code into v_code
  from public.organizations o
  where o.id = p_org_id;

  return v_code;
end;
$$;

grant execute on function public.create_organization_with_site(text, text, text, text, text) to authenticated;
grant execute on function public.request_join_organization(text) to authenticated;
grant execute on function public.approve_member(uuid, text) to authenticated;
grant execute on function public.reject_member(uuid) to authenticated;
grant execute on function public.rotate_organization_access_code(uuid) to authenticated;
grant execute on function public.get_organization_access_code(uuid) to authenticated;
