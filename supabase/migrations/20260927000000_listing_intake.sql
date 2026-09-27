-- Location, phone, intake method, and seeker interest (waitlist / register).
-- Not a second matcher. Hard filters still remove listings. This is distance
-- and how a person actually gets in.

alter table public.listings
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists phone text,
  add column if not exists intake_method text;

alter table public.listings drop constraint if exists listings_intake_method_check;
alter table public.listings
  add constraint listings_intake_method_check
  check (
    intake_method is null
    or intake_method in ('call', 'waitlist', 'register', 'walk_up')
  );

update public.listings set
  lat = 37.3394,
  lng = -121.8920,
  phone = '+14085550101',
  intake_method = 'register'
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000001';

update public.listings set
  lat = 37.3305,
  lng = -121.9072,
  phone = '+14085550102',
  intake_method = 'waitlist'
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000002';

update public.listings set
  lat = 37.3472,
  lng = -121.8204,
  phone = '+14085550103',
  intake_method = 'call'
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000003';

update public.listings set
  lat = 37.3541,
  lng = -121.9552,
  phone = '+14085550104',
  intake_method = 'walk_up'
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000004';

update public.listings set
  lat = 37.3081,
  lng = -121.8474,
  phone = '+14085550105',
  intake_method = 'register'
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000005';

update public.listings set
  lat = 37.3234,
  lng = -121.9781,
  phone = '+14085550106',
  intake_method = 'waitlist'
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000006';

create table if not exists public.listing_interest (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('waitlist', 'register', 'on_the_way')),
  status text not null default 'active' check (status in ('active', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (listing_id, user_id, kind)
);

create index if not exists listing_interest_listing_idx
  on public.listing_interest (listing_id, status);

create index if not exists listing_interest_user_idx
  on public.listing_interest (user_id, status);

alter table public.listing_interest enable row level security;

drop policy if exists "own listing interest" on public.listing_interest;
create policy "own listing interest"
  on public.listing_interest for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "staff read listing interest" on public.listing_interest;
create policy "staff read listing interest"
  on public.listing_interest for select to authenticated
  using (
    exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = listing_interest.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

grant select, insert, update, delete on public.listing_interest to authenticated;
