-- Moving one site to another organization, by code.
--
-- The existing access code is a property of an ORGANIZATION and it means
-- "let me work here": you enter it, a director approves you, and you can edit
-- everything that org runs. There was no way to hand over a single site, which
-- is what actually happens on the ground. A church stops hosting a lot and
-- another operator picks it up; a county programme is contracted out; one
-- person set a site up on their own account and the organization that really
-- runs it needs it back. Until now the only route was to rebuild the listing
-- by hand, which loses its id, and with it every saved place, request and
-- review that points at it.
--
-- A transfer code is therefore per site, single use, and expiring.

create table if not exists public.site_transfer_codes (
  code text primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  -- Kept even after the transfer, so the row is its own audit record: who gave
  -- the site away, who took it, and when.
  from_organization_id uuid not null references public.organizations (id) on delete cascade,
  to_organization_id uuid references public.organizations (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);

-- At most one code a site can actually be claimed with. Issuing a new one
-- revokes the last, so a code read aloud over the phone and then thought
-- better of does not stay live.
create unique index if not exists site_transfer_codes_one_open
  on public.site_transfer_codes (listing_id)
  where redeemed_at is null and revoked_at is null;

create index if not exists site_transfer_codes_listing
  on public.site_transfer_codes (listing_id);

alter table public.site_transfer_codes enable row level security;

-- No policies on purpose, so PostgREST exposes nothing: a table of live codes
-- is a table of keys to other people's listings. Everything below is security
-- definer and hands back only what the caller is entitled to see.

create or replace function public.create_site_transfer_code(p_listing_id uuid)
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_code text;
  v_expires timestamptz := now() + interval '7 days';
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select l.organization_id into v_org_id
  from public.listings l where l.id = p_listing_id;

  if v_org_id is null then
    raise exception 'Site not found';
  end if;

  -- Director only. Handing a site to another organization is not the same
  -- kind of act as editing its opening hours, and a manager can do the latter.
  if not public.is_org_director(v_org_id) then
    raise exception 'Only a director can transfer a site';
  end if;

  update public.site_transfer_codes
  set revoked_at = now()
  where listing_id = p_listing_id
    and redeemed_at is null
    and revoked_at is null;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.site_transfer_codes c where c.code = v_code
    );
  end loop;

  insert into public.site_transfer_codes
    (code, listing_id, from_organization_id, created_by, expires_at)
  values (v_code, p_listing_id, v_org_id, v_user_id, v_expires);

  return query select v_code, v_expires;
end;
$$;

create or replace function public.revoke_site_transfer_code(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select l.organization_id into v_org_id
  from public.listings l where l.id = p_listing_id;

  if v_org_id is null or not public.is_org_director(v_org_id) then
    raise exception 'Only a director can revoke a transfer code';
  end if;

  update public.site_transfer_codes
  set revoked_at = now()
  where listing_id = p_listing_id
    and redeemed_at is null
    and revoked_at is null;
end;
$$;

-- What the owning side may see of its own open code.
create or replace function public.get_site_transfer_code(p_listing_id uuid)
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select l.organization_id into v_org_id
  from public.listings l where l.id = p_listing_id;

  if v_org_id is null or not public.is_org_director(v_org_id) then
    return;
  end if;

  return query
    select c.code, c.expires_at
    from public.site_transfer_codes c
    where c.listing_id = p_listing_id
      and c.redeemed_at is null
      and c.revoked_at is null
      and c.expires_at > now()
    limit 1;
end;
$$;

-- Reading a code before committing to it. Says what is on offer and who from,
-- and nothing else: the caller has no rights over this listing yet.
create or replace function public.preview_site_transfer_code(p_code text)
returns table (listing_name text, from_organization text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
    select l.name, o.name, c.expires_at
    from public.site_transfer_codes c
    join public.listings l on l.id = c.listing_id
    join public.organizations o on o.id = c.from_organization_id
    where c.code = v_code
      and c.redeemed_at is null
      and c.revoked_at is null
      and c.expires_at > now()
    limit 1;
end;
$$;

create or replace function public.redeem_site_transfer_code(p_code text)
returns table (listing_id uuid, listing_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_row public.site_transfer_codes;
  v_to_org uuid;
  v_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Locked, so two people racing the same code cannot both take the site.
  select * into v_row
  from public.site_transfer_codes c
  where c.code = v_code
  for update;

  if v_row.code is null then
    raise exception 'That code does not match any site';
  end if;
  if v_row.revoked_at is not null then
    raise exception 'That code was cancelled by the site';
  end if;
  if v_row.redeemed_at is not null then
    raise exception 'That code has already been used';
  end if;
  if v_row.expires_at <= now() then
    raise exception 'That code has expired. Ask for a new one';
  end if;

  -- The destination is the organization the redeemer can manage. Staff cannot
  -- take a site on their organization's behalf without the standing to run it.
  select m.organization_id into v_to_org
  from public.organization_members m
  where m.user_id = v_user_id
    and m.status = 'active'
    and m.role in ('director', 'manager')
  order by case when m.role = 'director' then 0 else 1 end
  limit 1;

  if v_to_org is null then
    raise exception 'Create or join an organization first, as a director or manager';
  end if;

  if v_to_org = v_row.from_organization_id then
    raise exception 'That site already belongs to your organization';
  end if;

  update public.listings
  set organization_id = v_to_org
  where id = v_row.listing_id
  returning name into v_name;

  update public.site_transfer_codes
  set redeemed_at = now(), redeemed_by = v_user_id, to_organization_id = v_to_org
  where code = v_code;

  return query select v_row.listing_id, v_name;
end;
$$;

grant execute on function public.create_site_transfer_code(uuid) to authenticated;
grant execute on function public.revoke_site_transfer_code(uuid) to authenticated;
grant execute on function public.get_site_transfer_code(uuid) to authenticated;
grant execute on function public.preview_site_transfer_code(text) to authenticated;
grant execute on function public.redeem_site_transfer_code(text) to authenticated;
