-- Shelter and parking rules the seeker questionnaire already asks about.
--
-- lib/matching/needs.ts was written against these columns before they existed:
-- its header says "Time fields (curfew, intake window, max stay) are structured
-- so the matcher can compare them to the site's own hours." Until now there was
-- nothing to compare against, so 7 of 12 answers were collected and discarded.
--
-- Unknown is null. There is no 'unknown' member in any enum here.
-- Nothing in this file scores. Hard filters stay in lib/matching/hard-filters.ts.

alter table public.listings
  add column if not exists address text,
  add column if not exists id_required text,
  add column if not exists curfew_policy text,
  add column if not exists curfew_time time,
  add column if not exists intake_from time,
  add column if not exists intake_to time,
  add column if not exists max_stay text,
  add column if not exists pet_weight_limit_lbs integer,
  add column if not exists vehicle_allowed text,
  add column if not exists vehicle_max_length_ft integer,
  add column if not exists registration_required text,
  add column if not exists project_type text,
  add column if not exists total_beds integer,
  add column if not exists data_source text,
  add column if not exists source_url text,
  add column if not exists source_as_of date;

-- Named, dropped-then-added so this migration is re-runnable, matching the
-- listings_intake_method_check pattern in 20260927000000_listing_intake.sql.

alter table public.listings drop constraint if exists listings_id_required_check;
alter table public.listings
  add constraint listings_id_required_check
  check (
    id_required is null
    or id_required in ('required', 'not_required', 'case_by_case')
  );

alter table public.listings drop constraint if exists listings_curfew_policy_check;
alter table public.listings
  add constraint listings_curfew_policy_check
  check (curfew_policy is null or curfew_policy in ('no_curfew', 'fixed_time'));

alter table public.listings drop constraint if exists listings_max_stay_check;
alter table public.listings
  add constraint listings_max_stay_check
  check (
    max_stay is null
    or max_stay in (
      'one_night', 'up_to_7_nights', 'up_to_14_nights', 'up_to_30_nights',
      'up_to_90_nights', 'up_to_180_nights', 'no_limit'
    )
  );

alter table public.listings drop constraint if exists listings_vehicle_allowed_check;
alter table public.listings
  add constraint listings_vehicle_allowed_check
  check (
    vehicle_allowed is null
    or vehicle_allowed in ('car_only', 'car_van', 'car_van_rv')
  );

alter table public.listings
  drop constraint if exists listings_registration_required_check;
alter table public.listings
  add constraint listings_registration_required_check
  check (
    registration_required is null
    or registration_required in ('required', 'not_required', 'case_by_case')
  );

alter table public.listings drop constraint if exists listings_project_type_check;
alter table public.listings
  add constraint listings_project_type_check
  check (
    project_type is null
    or project_type in
      ('emergency_shelter', 'safe_haven', 'transitional_housing')
  );

alter table public.listings drop constraint if exists listings_data_source_check;
alter table public.listings
  add constraint listings_data_source_check
  check (
    data_source is null
    or data_source in
      ('provider_portal', 'hud_hic_2025', 'city_program', 'county_osh')
  );

-- Ranges, matching what the questionnaire accepts. The pet weight input in
-- components/matching/find-a-place-form.tsx validates 1 to 200, so a limit
-- outside that range could never be compared to anything.
alter table public.listings drop constraint if exists listings_pet_weight_limit_check;
alter table public.listings
  add constraint listings_pet_weight_limit_check
  check (pet_weight_limit_lbs is null or pet_weight_limit_lbs between 1 and 200);

alter table public.listings drop constraint if exists listings_vehicle_length_check;
alter table public.listings
  add constraint listings_vehicle_length_check
  check (vehicle_max_length_ft is null or vehicle_max_length_ft between 8 and 60);

alter table public.listings drop constraint if exists listings_bed_count_check;
alter table public.listings
  add constraint listings_bed_count_check
  check (total_beds is null or total_beds >= 0);

-- Cross column shapes. These are the ones a hand written data load violates.

-- A fixed curfew needs a time. "No curfew" must not carry one, or the matcher
-- would compare against a time the site says does not apply.
alter table public.listings drop constraint if exists listings_curfew_shape_check;
alter table public.listings
  add constraint listings_curfew_shape_check
  check (
    (curfew_policy is null and curfew_time is null)
    or (curfew_policy = 'no_curfew' and curfew_time is null)
    or (curfew_policy = 'fixed_time' and curfew_time is not null)
  );

-- A half open intake window cannot be compared to anything, so both ends are
-- set or neither is.
--
-- Deliberately NOT constrained: intake_to earlier than intake_from. That means
-- the window wraps past midnight (intake 20:00 to 02:00 is a real pattern) and
-- lib/matching/time.ts handles it. Do not add a check forbidding it.
alter table public.listings
  drop constraint if exists listings_intake_window_shape_check;
alter table public.listings
  add constraint listings_intake_window_shape_check
  check ((intake_from is null) = (intake_to is null));

-- Provenance travels together. A source with no as-of date cannot be aged.
alter table public.listings drop constraint if exists listings_source_shape_check;
alter table public.listings
  add constraint listings_source_shape_check
  check (data_source is null or source_as_of is not null);

-- Existing sample rows were typed by staff in the portal, so label them that
-- way rather than leaving provenance null. The two parking rows also carry
-- vehicle facts as free text in vehicle_note; translate them into the new
-- structured columns. vehicle_note stays for display, but the matcher only
-- ever reads the structured pair.
update public.listings
set
  data_source = 'provider_portal',
  source_as_of = current_date
where data_source is null;

update public.listings
set vehicle_allowed = 'car_van', vehicle_max_length_ft = 22
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000005'
  and vehicle_allowed is null;

update public.listings
set vehicle_allowed = 'car_van_rv', vehicle_max_length_ft = 32
where id = 'a1e1c0a0-0b11-4c22-8d33-000000000006'
  and vehicle_allowed is null;
