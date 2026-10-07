// Generates supabase/migrations/20260928000100_ca500_inventory.sql from the two
// committed source files:
//
//   lib/listings/sources/hud-hic-ca500-2025.ts   shelters (HUD, CoC CA-500)
//   lib/listings/sources/safe-parking-ca500.ts   parking (city program pages)
//
// Run after editing either one:
//   node scripts/build-inventory-sql.mjs
//
// This exists so the database and lib/listings/seed.ts cannot drift apart. Both
// derive from the same two files, and neither is hand maintained.
//
// Node imports the .ts sources directly: their only imports are `import type`,
// which Node's type stripping erases, so no loader or build step is needed.

import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const root = resolve(import.meta.dirname, "..")
const load = (rel) => import(pathToFileURL(resolve(root, rel)).href)

const { hicFacilities, hicOrganizations } = await load(
  "lib/listings/sources/hud-hic-ca500-2025.ts"
)
const { safeParkingSites, safeParkingOrganizations } = await load(
  "lib/listings/sources/safe-parking-ca500.ts"
)
const { hudHic2025, unknownCity } = await load("lib/listings/sources.ts")

/** Postgres string literal. Doubles any single quote. */
/** Postgres text[] literal, or null. */
const arr = (values) =>
  values && values.length
    ? `ARRAY[${values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(", ")}]::text[]`
    : "null"

const q = (value) =>
  value == null ? "null" : `'${String(value).replace(/'/g, "''")}'`
const n = (value) => (value == null ? "null" : String(value))

// The six invented sample sites that shipped in migration 1. They are removed
// here rather than edited out of that migration, so anyone who already applied
// it converges on the same state.
const sampleOrgs = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
]

const featured = [
  "6f2a2ec5-1c51-546e-86b9-1c55b7b53f71",
  "8745253f-a2b4-57df-928e-4813ddba22af",
  "29ed0c70-2ca2-5015-8a3b-dee00029493e",
]

const shelters = hicFacilities.filter((site) => !site.confidential)
const orgNames = new Map(
  [...hicOrganizations, ...safeParkingOrganizations].map((o) => [o.id, o.name])
)

const rows = []

// Safe parking first, then shelters with a known city, then the rest. Matches
// the order in lib/listings/seed.ts so the feed looks the same either way.
const ordered = [
  ...safeParkingSites.map((site) => ({ kind: "parking", site })),
  ...shelters.filter((s) => s.city).map((site) => ({ kind: "shelter", site })),
  ...shelters.filter((s) => !s.city).map((site) => ({ kind: "shelter", site })),
]

ordered.forEach(({ kind, site }, index) => {
  const isParking = kind === "parking"
  rows.push(
    [
      "  (",
      `    ${q(site.id)},`,
      `    ${q(site.orgId)},`,
      `    ${q(isParking ? site.name : site.facility)},`,
      `    ${q(kind)},`,
      // Every row is call_first. A county inventory counted in January 2025 is
      // not Live, and a city program page is not a live feed.
      "    'call_first',",
      // Never now(). last_confirmed_at defaults to now(), which would render a
      // January 2025 count as "Confirmed 1 minute ago". That is the single most
      // damaging thing this file could get wrong.
      `    ${q(
        isParking
          ? `${site.checkedOn}T00:00:00Z`
          : `${hudHic2025.asOf}T00:00:00Z`
      )},`,
      `    ${q(isParking ? site.city : (site.city ?? unknownCity))},`,
      `    ${q(isParking ? site.address : null)},`,
      `    ${q(isParking ? site.phone : null)},`,
      "    'call',",
      `    ${q(isParking ? site.vehicleNote : null)},`,
      `    ${q(isParking ? site.vehicleAllowed : null)},`,
      `    ${q(isParking ? site.registrationRequired : null)},`,
      `    ${isParking && site.intakeFrom ? q(site.intakeFrom) : "null"},`,
      `    ${isParking && site.intakeTo ? q(site.intakeTo) : "null"},`,
      `    ${q(isParking ? null : site.projectType)},`,
      `    ${q(isParking ? "city_program" : "hud_hic_2025")},`,
      `    ${q(isParking ? site.sourceUrl : hudHic2025.url)},`,
      `    ${q(isParking ? site.checkedOn : hudHic2025.asOf)},`,
      // What a lot is like to use. HUD's bed count publishes none of it.
      `    ${q(isParking ? site.cost : null)},`,
      `    ${q(isParking ? site.screening : null)},`,
      `    ${isParking ? arr(site.documents) : "null"},`,
      `    ${q(isParking ? site.facilities : null)},`,
      `    ${q(isParking ? site.security : null)},`,
      `    ${q(isParking ? site.maxStayNote : null)},`,
      `    ${q(isParking ? site.waitlist : null)},`,
      `    ${q(isParking ? site.petsNote : null)},`,
      `    ${featured.includes(site.id) ? "true" : "false"},`,
      `    ${n(index + 1)},`,
      "    true",
      "  )",
    ].join("\n")
  )
})

// Only organizations that still have a listing. Excluding the DV programs
// leaves some HUD providers with nothing to point at, and an org with no site
// is just an orphaned access code nobody can claim.
const usedOrgIds = new Set(ordered.map(({ site }) => site.orgId))

const orgRows = [...hicOrganizations, ...safeParkingOrganizations]
  .filter((org) => usedOrgIds.has(org.id))
  .map(
    (org) =>
      `  (${q(org.id)}, ${q(org.name)}, ${q(
        org.description ?? null
      )}, public.generate_access_code())`
  )

const header = `-- Santa Clara County shelter and safe parking inventory, CoC CA-500.
--
-- GENERATED FILE. Do not hand edit.
--   node scripts/build-inventory-sql.mjs
-- Sources of record:
--   lib/listings/sources/hud-hic-ca500-2025.ts
--   lib/listings/sources/safe-parking-ca500.ts
--
-- Shelters come from the HUD 2025 Continuum of Care Housing Inventory Count
-- Report for CoC CA-500, counted during the last 10 days of January 2025:
--   ${hudHic2025.url}
-- Safe parking comes from each city's own program page, because HUD's count
-- contains zero safe parking sites (parking is not bed inventory).
--
-- Every policy column HUD does not publish is left null on purpose: pets, pet
-- weight limit, couples, ID, curfew, check-in window, max stay. Null means
-- "not published", never "no". See lib/listings/sources.ts for what each
-- source covers, and how the UI turns a null into "call to check".
--
-- ${shelters.length} shelters and ${safeParkingSites.length} safe parking sites.
-- ${hicFacilities.length - shelters.length} domestic violence programs from the HUD list are deliberately
-- excluded: their locations are not public, and crisis and DV go through a
-- separate human path rather than the listings feed.

-- The six invented sample sites from 20260918000000_listings.sql. Removed
-- rather than edited out of that migration, so a project that already applied
-- it converges on the same state. Listings cascade from the org.
delete from public.organizations where id in (
${sampleOrgs.map((id) => `  ${q(id)}`).join(",\n")}
);

insert into public.organizations (id, name, description, access_code) values
${orgRows.join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.listings (
  id, organization_id, name, kind, freshness, last_confirmed_at, city,
  address, phone, intake_method, vehicle_note, vehicle_allowed,
  registration_required, intake_from, intake_to, project_type,
  data_source, source_url, source_as_of,
  cost_note, screening_note, requires_documents, facilities_note,
  security_note, max_stay_note, waitlist_note, pets_note,
  featured, sort_order, published
) values
${rows.join(",\n")}
on conflict (id) do update set
  organization_id = excluded.organization_id,
  name = excluded.name,
  kind = excluded.kind,
  freshness = excluded.freshness,
  last_confirmed_at = excluded.last_confirmed_at,
  city = excluded.city,
  address = excluded.address,
  phone = excluded.phone,
  intake_method = excluded.intake_method,
  vehicle_note = excluded.vehicle_note,
  vehicle_allowed = excluded.vehicle_allowed,
  registration_required = excluded.registration_required,
  intake_from = excluded.intake_from,
  intake_to = excluded.intake_to,
  project_type = excluded.project_type,
  data_source = excluded.data_source,
  source_url = excluded.source_url,
  source_as_of = excluded.source_as_of,
  cost_note = excluded.cost_note,
  screening_note = excluded.screening_note,
  requires_documents = excluded.requires_documents,
  facilities_note = excluded.facilities_note,
  security_note = excluded.security_note,
  max_stay_note = excluded.max_stay_note,
  waitlist_note = excluded.waitlist_note,
  pets_note = excluded.pets_note,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  published = excluded.published;
`

const out = resolve(
  root,
  "supabase/migrations/20260928000100_ca500_inventory.sql"
)
writeFileSync(out, header, "utf8")
console.log(
  `Wrote ${ordered.length} listings and ${orgRows.length} organizations to ${out}`
)
