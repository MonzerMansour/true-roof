-- Stop (0, 0) being stored as a location.
--
-- (0, 0) is a real point in the Gulf of Guinea, about 7,900 miles from San
-- Jose. It is also what an unset or mis-saved coordinate column looks like, and
-- application code that checks `lat is not null` lets it straight through. One
-- portal-created row held 0.0002, -0.0005, which rendered a shelter as
-- "7934 mi" in the feed and pointed its Directions link at open ocean. Note the
-- near-zero values: an exact (0, 0) test would have missed it.
--
-- The guard is enforced in two places on purpose: usableCoordinate() in
-- lib/listings/geo.ts protects reads of rows that already exist, and this
-- constraint stops new ones being written.
--
-- The range is the whole globe rather than a Santa Clara County box. This
-- rejects corrupt data without deciding in SQL that the product can never list
-- a site outside the county.

-- Null out any existing (0, 0) rows first, or the constraint cannot be added.
-- Null is the honest value: it means "we do not know where this is", which is
-- true, and the UI already handles it.
update public.listings
set lat = null, lng = null
where (abs(lat) < 0.5 and abs(lng) < 0.5)
   or lat < -90 or lat > 90
   or lng < -180 or lng > 180;

alter table public.listings drop constraint if exists listings_coordinates_check;
alter table public.listings
  add constraint listings_coordinates_check
  check (
    -- Both set or neither. A half coordinate cannot place anything.
    (lat is null and lng is null)
    or (
      lat is not null and lng is not null
      -- Null Island, half a degree either way. The row that caused this held
      -- 0.0002, -0.0005, so an exact (0, 0) test is not enough.
      and not (abs(lat) < 0.5 and abs(lng) < 0.5)
      and lat between -90 and 90
      and lng between -180 and 180
    )
  );
