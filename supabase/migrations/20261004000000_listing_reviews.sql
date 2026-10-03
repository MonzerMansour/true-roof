-- Listing reviews (UGC stars ± text) plus staff-editable external averages.
-- No live Google sync. External fields are display-only estimates.

alter table public.listings
  add column if not exists external_rating numeric(2, 1)
    check (external_rating is null or (external_rating >= 1.0 and external_rating <= 5.0)),
  add column if not exists external_rating_count integer
    check (external_rating_count is null or external_rating_count >= 0),
  add column if not exists external_rating_source text;

create table if not exists public.listing_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  stars integer not null check (stars >= 1 and stars <= 5),
  body text,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'rejected', 'hidden')),
  verified_stay boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create index if not exists listing_reviews_listing_status_idx
  on public.listing_reviews (listing_id, status);

create index if not exists listing_reviews_user_created_idx
  on public.listing_reviews (user_id, created_at desc);

create table if not exists public.listing_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.listing_reviews (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

create index if not exists listing_review_reports_review_idx
  on public.listing_review_reports (review_id);

alter table public.listing_reviews enable row level security;
alter table public.listing_review_reports enable row level security;

-- Published reviews are readable by anyone (including anon).
drop policy if exists "read published reviews" on public.listing_reviews;
create policy "read published reviews"
  on public.listing_reviews for select to anon, authenticated
  using (status = 'published');

-- Authors can read their own rows in any status.
drop policy if exists "read own reviews" on public.listing_reviews;
create policy "read own reviews"
  on public.listing_reviews for select to authenticated
  using (auth.uid() = user_id);

-- Org staff can read every review for their listings.
drop policy if exists "staff read listing reviews" on public.listing_reviews;
create policy "staff read listing reviews"
  on public.listing_reviews for select to authenticated
  using (
    exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = listing_reviews.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Authenticated users insert their own review. Status is set by the app;
-- RLS still requires the row to belong to the caller.
drop policy if exists "insert own review" on public.listing_reviews;
create policy "insert own review"
  on public.listing_reviews for insert to authenticated
  with check (auth.uid() = user_id);

-- Authors can update their own review (edit stars/body, or withdraw to hidden).
drop policy if exists "update own review" on public.listing_reviews;
create policy "update own review"
  on public.listing_reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Staff can change status (hide / reject) on reviews for their sites.
drop policy if exists "staff moderate listing reviews" on public.listing_reviews;
create policy "staff moderate listing reviews"
  on public.listing_reviews for update to authenticated
  using (
    exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = listing_reviews.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = listing_reviews.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Reports: author can insert; staff of the listing can read.
drop policy if exists "insert own review report" on public.listing_review_reports;
create policy "insert own review report"
  on public.listing_review_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "staff read review reports" on public.listing_review_reports;
create policy "staff read review reports"
  on public.listing_review_reports for select to authenticated
  using (
    exists (
      select 1
      from public.listing_reviews r
      join public.listings l on l.id = r.listing_id
      join public.organization_members m
        on m.organization_id = l.organization_id
      where r.id = listing_review_reports.review_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

grant select on public.listing_reviews to anon, authenticated;
grant insert, update on public.listing_reviews to authenticated;
grant select, insert on public.listing_review_reports to authenticated;

-- Aggregate of published True Roof reviews per listing.
create or replace view public.listing_review_stats
with (security_invoker = true) as
select
  listing_id,
  count(*)::integer as review_count,
  round(avg(stars)::numeric, 1) as average_stars
from public.listing_reviews
where status = 'published'
group by listing_id;

grant select on public.listing_review_stats to anon, authenticated;
