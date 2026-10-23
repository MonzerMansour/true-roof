// One list of database columns per migration tier. Every select string in
// lib/listings/queries.ts and lib/portal/queries.ts derives from this, so
// adding a column is one edit here instead of six hardcoded strings.
//
// The tiers exist because queries.ts deliberately tolerates a database that
// has not run every migration yet. It tries the widest select first and falls
// back to a narrower one when Postgres rejects an unknown column.

export const listingColumns = {
  // 20260918000000_listings.sql
  core: [
    "id",
    "name",
    "kind",
    "freshness",
    "last_confirmed_at",
    "pets",
    "couples",
    "parking_status",
    "vehicle_note",
    "city",
  ],
  // 20260927000000_listing_intake.sql
  intake: ["lat", "lng", "phone", "intake_method"],
  // 20260928000000_listing_policies.sql
  policies: [
    "address",
    "id_required",
    "curfew_policy",
    "curfew_time",
    "intake_from",
    "intake_to",
    "max_stay",
    "pet_weight_limit_lbs",
    "vehicle_allowed",
    "vehicle_max_length_ft",
    "registration_required",
    "project_type",
    "total_beds",
    "data_source",
    "source_url",
    "source_as_of",
  ],
  // 20261006000000_parking_operations.sql. What a lot is like to use: cost,
  // screening, documents, facilities, security, stay, waitlist, pets.
  operations: [
    "cost_note",
    "screening_note",
    "requires_documents",
    "facilities_note",
    "security_note",
    "max_stay_note",
    "waitlist_note",
    "pets_note",
  ],
  // 20261003000100_listing_details.sql
  details: ["description", "photo_url"],
  // 20261004000000_listing_reviews.sql
  reviews: [
    "external_rating",
    "external_rating_count",
    "external_rating_source",
  ],
} as const

export type ColumnTier = keyof typeof listingColumns

const orgJoin = "organizations(name, description)"

function join(tiers: ColumnTier[], extra: string[] = []) {
  return [...tiers.flatMap((tier) => listingColumns[tier]), ...extra].join(", ")
}

// Widest first. queries.ts walks this in order and stops at the first select
// the database accepts, so a partially migrated project still serves rows.
export const listingSelectTiers = [
  join(
    ["core", "intake", "policies", "details", "reviews", "operations"],
    [orgJoin]
  ),
  join(["core", "intake", "policies", "details", "reviews"], [orgJoin]),
  join(["core", "intake", "policies", "details"], [orgJoin]),
  join(["core", "intake", "policies", "reviews"], [orgJoin]),
  join(["core", "intake", "policies"], [orgJoin]),
  join(["core", "intake"], [orgJoin]),
  join(["core"], [orgJoin]),
]

// The portal reads drafts, so it needs the ops columns the seeker never sees
// and does not join organizations (it already has the org in context).
const portalExtra = ["organization_id", "published", "sort_order"]

export const portalListingSelectTiers = [
  join(
    ["core", "intake", "policies", "details", "reviews", "operations"],
    portalExtra
  ),
  join(["core", "intake", "policies", "details", "reviews"], portalExtra),
  join(["core", "intake", "policies", "details"], portalExtra),
  join(["core", "intake", "policies", "reviews"], portalExtra),
  join(["core", "intake", "policies"], portalExtra),
  join(["core", "intake"], portalExtra),
  join(["core"], portalExtra),
]
