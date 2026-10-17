-- A code per site, and shared editing.
--
-- The portal had one code per ORGANIZATION. It let somebody ask to join the
-- org, a director approved them, and they could then edit everything that org
-- ran. That is the wrong shape for how these places actually work: a lot is
-- co-run by a church and a non-profit, a county worker helps keep one shelter's
-- hours current, somebody sets a site up and a colleague needs to help with
-- that site and nothing else. Handing over the whole organization to do any of
-- that is too much.
--
-- So the code moves to the site. Anyone with a site's code can view and edit
-- that site, and sees it on their own dashboard beside their own. It is shared
-- editing, not a handover: the organization that created the site still owns
-- it and still has it.

-- The code lives in its own table, NOT on listings. public.listings is
-- readable by anon for every published row, so a column there would hand every
-- site's code to anybody who asked PostgREST for it.
create table if not exists public.listing_access_codes (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.listing_access_codes enable row level security;
-- No policies, deliberately: a table of codes is a table of keys. Everything
-- below is security definer and returns only what the caller is entitled to.

create table if not exists public.listing_members (
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

alter table public.listing_members enable row level security;

drop policy if exists "read own listing access" on public.listing_members;
create policy "read own listing access"
  on public.listing_members for select to authenticated
  using (user_id = auth.uid());

-- Anyone can walk away from a site somebody shared with them.
drop policy if exists "drop own listing access" on public.listing_members;
create policy "drop own listing access"
  on public.listing_members for delete to authenticated
  using (user_id = auth.uid());

create index if not exists listing_members_user on public.listing_members (user_id);

create or replace function public.new_listing_access_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    -- No I, O, 0 or 1: these get read down a phone and written on paper.
    candidate := upper(substr(translate(replace(gen_random_uuid()::text, '-', ''), 'io01', 'wxyz'), 1, 8));
    exit when not exists (
      select 1 from public.listing_access_codes c where c.code = candidate
    );
  end loop;
  return candidate;
end;
$$;

-- Every site gets a code the moment it exists, including sites made by the
-- existing create_organization_with_site and add_site_to_organization RPCs,
-- which is why this is a trigger and not a line in either of them.
create or replace function public.give_listing_access_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.listing_access_codes (listing_id, code)
  values (new.id, public.new_listing_access_code())
  on conflict (listing_id) do nothing;
  return new;
end;
$$;

drop trigger if exists listings_access_code on public.listings;
create trigger listings_access_code
  after insert on public.listings
  for each row execute function public.give_listing_access_code();

-- Sites that already existed when this ran.
insert into public.listing_access_codes (listing_id, code)
select l.id, public.new_listing_access_code()
from public.listings l
where not exists (
  select 1 from public.listing_access_codes c where c.listing_id = l.id
);

create or replace function public.is_listing_member(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.listing_members m
    where m.listing_id = p_listing_id and m.user_id = auth.uid()
  );
$$;

-- Shared editors get the same reach over one site that an org member has over
-- all of theirs, and no more.
drop policy if exists "shared members read listings" on public.listings;
create policy "shared members read listings"
  on public.listings for select to authenticated
  using (public.is_listing_member(id));

drop policy if exists "shared members update listings" on public.listings;
create policy "shared members update listings"
  on public.listings for update to authenticated
  using (public.is_listing_member(id))
  with check (public.is_listing_member(id));

-- Reading a site's own code. Shared editors can see it too, so whoever is
-- holding the site together can pass it on without going back to the owner.
create or replace function public.get_listing_access_code(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select l.organization_id into v_org from public.listings l where l.id = p_listing_id;
  if v_org is null then return null; end if;

  if not (public.is_active_org_member(v_org) or public.is_listing_member(p_listing_id)) then
    return null;
  end if;

  return (select c.code from public.listing_access_codes c where c.listing_id = p_listing_id);
end;
$$;

-- Issuing a new code, which stops the old one working. For when a code has
-- been passed around further than intended.
create or replace function public.rotate_listing_access_code(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_code text;
begin
  select l.organization_id into v_org from public.listings l where l.id = p_listing_id;
  if v_org is null then
    raise exception 'Site not found';
  end if;

  -- The organization that owns the site decides who may hold its key, not a
  -- shared editor who was let in with it.
  if not public.can_manage_org(v_org) then
    raise exception 'Only the organization that runs this site can change its code';
  end if;

  v_code := public.new_listing_access_code();

  insert into public.listing_access_codes (listing_id, code)
  values (p_listing_id, v_code)
  on conflict (listing_id) do update set code = excluded.code, created_at = now();

  return v_code;
end;
$$;

create or replace function public.join_listing_with_code(p_code text)
returns table (listing_id uuid, listing_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_listing uuid;
  v_name text;
  v_org uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select c.listing_id into v_listing
  from public.listing_access_codes c where c.code = v_code;

  if v_listing is null then
    raise exception 'That code does not match any site';
  end if;

  select l.organization_id, l.name into v_org, v_name
  from public.listings l where l.id = v_listing;

  -- Somebody whose own organization runs the site already has it.
  if public.is_active_org_member(v_org) then
    raise exception 'Your organization already runs this site';
  end if;

  insert into public.listing_members (listing_id, user_id)
  values (v_listing, v_user)
  on conflict (listing_id, user_id) do nothing;

  return query select v_listing, v_name;
end;
$$;

grant execute on function public.get_listing_access_code(uuid) to authenticated;
grant execute on function public.rotate_listing_access_code(uuid) to authenticated;
grant execute on function public.join_listing_with_code(text) to authenticated;
grant execute on function public.is_listing_member(uuid) to authenticated;

-- Choosing a site's code rather than taking the generated one.
--
-- Validated here rather than trusted from the form: this code is the only
-- thing standing between a stranger and editing what a shelter tells people
-- about its beds, so "SHELTER1" cannot be allowed through just because
-- somebody typed it.
create or replace function public.set_listing_access_code(
  p_listing_id uuid,
  p_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
begin
  select l.organization_id into v_org from public.listings l where l.id = p_listing_id;
  if v_org is null then
    raise exception 'Site not found';
  end if;

  if not public.can_manage_org(v_org) then
    raise exception 'Only the organization that runs this site can set its code';
  end if;

  if length(v_code) < 6 or length(v_code) > 16 then
    raise exception 'A code needs between 6 and 16 characters';
  end if;

  if v_code !~ '^[A-Z0-9]+$' then
    raise exception 'A code can only use letters and numbers';
  end if;

  if exists (
    select 1 from public.listing_access_codes c
    where c.code = v_code and c.listing_id <> p_listing_id
  ) then
    raise exception 'That code is already in use. Pick another';
  end if;

  insert into public.listing_access_codes (listing_id, code)
  values (p_listing_id, v_code)
  on conflict (listing_id) do update set code = excluded.code, created_at = now();

  return v_code;
end;
$$;

grant execute on function public.set_listing_access_code(uuid, text) to authenticated;
