-- How full a site is right now.
--
-- A site publishes two numbers: the most people it can hold, which is the
-- existing total_beds column, and how many are there now, which is this new
-- current_people column. Spots left is the difference, worked out where it is
-- shown, so staff only ever keep two numbers in step. At 5 spots left or fewer
-- a seeker sees "Almost full".
--
-- Nullable on purpose. The imported Santa Clara sites have a bed count from the
-- HUD inventory but nobody has told us who is there tonight, and null means
-- "not published", never zero. The portal makes both numbers required for a
-- new site and for publishing a draft; the database does not, because a rule
-- written as a constraint would reject every imported row.

alter table public.listings
  add column if not exists current_people integer;

alter table public.listings
  drop constraint if exists listings_current_people_range;
alter table public.listings
  add constraint listings_current_people_range
  check (current_people is null or (current_people >= 0 and current_people <= 10000));
