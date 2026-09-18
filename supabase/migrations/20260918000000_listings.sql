-- True Roof schema. One row per physical site. Public read for marketing cards.
-- Apply with: npm run db:setup
-- Or paste into Supabase SQL editor.

create table if not exists public.organizations (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('shelter', 'parking')),
  freshness text not null check (freshness in ('live', 'recent', 'call_first')),
  last_confirmed_at timestamptz not null default now(),
  pets text check (pets in ('not_allowed', 'service_only', 'small_pets', 'any')),
  couples text check (couples in ('not_allowed', 'same_room', 'separate_rooms')),
  parking_status text check (parking_status in ('open', 'full', 'waitlist')),
  vehicle_note text,
  city text not null default 'San Jose',
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'seeker' check (role in ('seeker', 'provider')),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.listings enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "public read organizations" on public.organizations;
create policy "public read organizations"
  on public.organizations for select to anon, authenticated using (true);

drop policy if exists "public read listings" on public.listings;
create policy "public read listings"
  on public.listings for select to anon, authenticated using (true);

drop policy if exists "own profile" on public.profiles;
create policy "own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'seeker')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.organizations (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'St. James Community'),
  ('22222222-2222-4222-8222-222222222222', 'South Bay Family Housing'),
  ('33333333-3333-4333-8333-333333333333', 'Eastside Women''s Overnight'),
  ('44444444-4444-4444-8444-444444444444', 'County Winter Shelter'),
  ('55555555-5555-4555-8555-555555555555', 'City Safe Parking'),
  ('66666666-6666-4666-8666-666666666666', 'Westside Faith Collaborative')
on conflict (id) do update set name = excluded.name;

insert into public.listings (
  id, organization_id, name, kind, freshness, last_confirmed_at,
  pets, couples, parking_status, vehicle_note, city, featured, sort_order
) values
  (
    'a1e1c0a0-0b11-4c22-8d33-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'St. James Night Shelter',
    'shelter', 'live', now() - interval '40 minutes',
    'service_only', 'same_room', null, null, 'San Jose', true, 1
  ),
  (
    'a1e1c0a0-0b11-4c22-8d33-000000000005',
    '55555555-5555-4555-8555-555555555555',
    'Senter Rd Safe Parking',
    'parking', 'live', now() - interval '55 minutes',
    'any', null, 'open', 'Cars and vans under 22 ft', 'San Jose', true, 2
  ),
  (
    'a1e1c0a0-0b11-4c22-8d33-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'Guadalupe Family Shelter',
    'shelter', 'recent', now() - interval '6 hours',
    'small_pets', 'same_room', null, null, 'San Jose', true, 3
  ),
  (
    'a1e1c0a0-0b11-4c22-8d33-000000000003',
    '33333333-3333-4333-8333-333333333333',
    'Eastside Women''s Overnight',
    'shelter', 'call_first', now() - interval '2 days',
    'not_allowed', 'not_allowed', null, null, 'San Jose', true, 4
  ),
  (
    'a1e1c0a0-0b11-4c22-8d33-000000000004',
    '44444444-4444-4444-8444-444444444444',
    'County Overflow Gym',
    'shelter', 'live', now() - interval '25 minutes',
    'service_only', 'separate_rooms', null, null, 'Santa Clara', true, 5
  ),
  (
    'a1e1c0a0-0b11-4c22-8d33-000000000006',
    '66666666-6666-4666-8666-666666666666',
    'Westside RV Lot',
    'parking', 'recent', now() - interval '9 hours',
    'any', null, 'waitlist', 'RVs and trailers, max 32 ft', 'San Jose', true, 6
  )
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  freshness = excluded.freshness,
  last_confirmed_at = excluded.last_confirmed_at,
  pets = excluded.pets,
  couples = excluded.couples,
  parking_status = excluded.parking_status,
  vehicle_note = excluded.vehicle_note,
  city = excluded.city,
  featured = excluded.featured,
  sort_order = excluded.sort_order;
