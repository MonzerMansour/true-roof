-- Staff can review a seeker who asked about their site. That is the
-- recourse when someone tanks a listing with bad-faith ratings.
-- Never a public score. Seekers cannot read these rows.

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  subject_user_id uuid not null references auth.users (id) on delete cascade,
  stars integer not null check (stars >= 1 and stars <= 5),
  body text,
  status text not null default 'published'
    check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, reviewer_id, subject_user_id),
  check (reviewer_id <> subject_user_id)
);

create index if not exists customer_reviews_listing_idx
  on public.customer_reviews (listing_id, created_at desc);

create index if not exists customer_reviews_subject_idx
  on public.customer_reviews (subject_user_id);

create table if not exists public.customer_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.customer_reviews (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

alter table public.customer_reviews enable row level security;
alter table public.customer_review_reports enable row level security;

-- Only org staff for that listing can read or write customer reviews.
drop policy if exists "staff read customer reviews" on public.customer_reviews;
create policy "staff read customer reviews"
  on public.customer_reviews for select to authenticated
  using (
    exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = customer_reviews.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "staff insert customer reviews" on public.customer_reviews;
create policy "staff insert customer reviews"
  on public.customer_reviews for insert to authenticated
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = customer_reviews.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
    and exists (
      select 1
      from public.listing_interest i
      where i.listing_id = customer_reviews.listing_id
        and i.user_id = customer_reviews.subject_user_id
        and i.status = 'active'
    )
  );

drop policy if exists "staff update customer reviews" on public.customer_reviews;
create policy "staff update customer reviews"
  on public.customer_reviews for update to authenticated
  using (
    exists (
      select 1
      from public.listings l
      join public.organization_members m
        on m.organization_id = l.organization_id
      where l.id = customer_reviews.listing_id
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
      where l.id = customer_reviews.listing_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- The seeker who was reviewed can report it. Staff of the listing can too.
drop policy if exists "insert customer review report" on public.customer_review_reports;
create policy "insert customer review report"
  on public.customer_review_reports for insert to authenticated
  with check (
    auth.uid() = reporter_id
    and (
      exists (
        select 1
        from public.customer_reviews r
        where r.id = customer_review_reports.review_id
          and r.subject_user_id = auth.uid()
      )
      or exists (
        select 1
        from public.customer_reviews r
        join public.listings l on l.id = r.listing_id
        join public.organization_members m
          on m.organization_id = l.organization_id
        where r.id = customer_review_reports.review_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
  );

drop policy if exists "staff read customer review reports" on public.customer_review_reports;
create policy "staff read customer review reports"
  on public.customer_review_reports for select to authenticated
  using (
    exists (
      select 1
      from public.customer_reviews r
      join public.listings l on l.id = r.listing_id
      join public.organization_members m
        on m.organization_id = l.organization_id
      where r.id = customer_review_reports.review_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
