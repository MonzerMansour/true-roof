// The fallback listing set, used when Supabase is not configured or the
// listings table is missing. lib/listings/queries.ts returns this with
// source: "seed".
//
// This matters more than a fallback usually would: someone who clones the repo
// and runs `npm run dev` with no .env.local sees ONLY this array. So it holds
// the real Santa Clara County data, not samples.
//
// Derived from the two source files rather than copied, so there is one place
// to change a fact:
//   lib/listings/sources/hud-hic-ca500-2025.ts   shelters (HUD, CoC CA-500)
//   lib/listings/sources/safe-parking-ca500.ts   parking (city program pages)
//
// The SQL in supabase/migrations/20260928000100_ca500_inventory.sql is
// generated from these same two files, so the database and this array cannot
// drift apart.

import {
  hicFacilities,
  hicOrganizations,
} from "@/lib/listings/sources/hud-hic-ca500-2025"
import {
  safeParkingOrganizations,
  safeParkingSites,
} from "@/lib/listings/sources/safe-parking-ca500"
import { hudHic2025, unknownCity } from "@/lib/listings/sources"
import type { Listing } from "@/lib/listings/types"

const orgName = new Map(
  [...hicOrganizations, ...safeParkingOrganizations].map((org) => [
    org.id,
    org.name,
  ])
)
const orgDescription = new Map(
  safeParkingOrganizations.map((org) => [org.id, org.description])
)

/** Midnight on the HUD count date, as a timestamp the app can age. */
const hicConfirmedAt = `${hudHic2025.asOf}T00:00:00.000Z`

// Domestic violence programs are deliberately left out of the listings feed.
// Their locations are not public, and .cursor/rules/language-dignity.mdc puts
// crisis and DV on a separate human path (911, the DV line, 988) that skips the
// data bundle. They stay flagged in the source file so nobody re-adds them by
// accident while thinking they are just missing.
const shelters: Listing[] = hicFacilities
  .filter((site) => !site.confidential)
  .map((site) => ({
    id: site.id,
    name: site.facility,
    kind: "shelter" as const,
    freshness: "call_first" as const,
    lastConfirmedAt: hicConfirmedAt,
    // HUD publishes none of the operational rules. Null, never guessed.
    pets: null,
    couples: null,
    parkingStatus: null,
    vehicleNote: null,
    // Where HUD's own facility name does not name a city, we say county wide
    // rather than assume San Jose. unknownCity is deliberately absent from
    // cityCenters, so these rows read "Distance not known" instead of showing
    // a distance measured from a city we picked.
    city: site.city ?? unknownCity,
    orgName: orgName.get(site.orgId) ?? site.provider,
    orgDescription: null,
    address: null,
    lat: null,
    lng: null,
    // Not the site's own number. The UI falls back to the county Here4You line,
    // which is how intake for these programs actually works.
    phone: null,
    intakeMethod: "call" as const,
    idRequired: null,
    curfewPolicy: null,
    curfewTime: null,
    intakeFrom: null,
    intakeTo: null,
    maxStay: null,
    petWeightLimitLbs: null,
    vehicleAllowed: null,
    vehicleMaxLengthFt: null,
    registrationRequired: null,
    projectType: site.projectType,
    totalBeds: null,
    // HUD's bed count publishes none of these, same as the policy columns.
    costNote: null,
    screeningNote: null,
    requiresDocuments: null,
    facilitiesNote: null,
    securityNote: null,
    maxStayNote: null,
    waitlistNote: null,
    petsNote: null,
    dataSource: "hud_hic_2025" as const,
    sourceUrl: hudHic2025.url,
    sourceAsOf: hudHic2025.asOf,
    externalRating: null,
    externalRatingCount: null,
    externalRatingSource: null,
  }))

const parking: Listing[] = safeParkingSites.map((site) => ({
  id: site.id,
  name: site.name,
  kind: "parking" as const,
  freshness: "call_first" as const,
  lastConfirmedAt: `${site.checkedOn}T00:00:00.000Z`,
  pets: null,
  couples: null,
  // Lot status changes week to week and a city program page is not a live
  // feed. Publishing a stale "open" is worse than publishing nothing.
  parkingStatus: null,
  vehicleNote: site.vehicleNote,
  city: site.city,
  orgName: orgName.get(site.orgId) ?? site.name,
  orgDescription: orgDescription.get(site.orgId) ?? null,
  address: site.address,
  lat: null,
  lng: null,
  phone: site.phone,
  intakeMethod: "call" as const,
  idRequired: null,
  curfewPolicy: null,
  curfewTime: null,
  intakeFrom: site.intakeFrom,
  intakeTo: site.intakeTo,
  maxStay: null,
  petWeightLimitLbs: null,
  vehicleAllowed: site.vehicleAllowed,
  vehicleMaxLengthFt: null,
  registrationRequired: site.registrationRequired,
  projectType: null,
  totalBeds: null,
  dataSource: "city_program" as const,
  sourceUrl: site.sourceUrl,
  sourceAsOf: site.checkedOn,
  costNote: site.cost,
  screeningNote: site.screening,
  requiresDocuments: site.documents,
  facilitiesNote: site.facilities,
  securityNote: site.security,
  maxStayNote: site.maxStayNote,
  waitlistNote: site.waitlist,
  petsNote: site.petsNote,
  externalRating: null,
  externalRatingCount: null,
  externalRatingSource: null,
}))

/** Most completely sourced first. The safe parking rows carry real addresses,
 * phones, vehicle rules and entry hours, so they are the most useful thing to
 * show someone. Shelters whose HUD name states a city come next, because those
 * at least have a distance. The rest follow. */
export const seedListings: Listing[] = [
  ...parking,
  ...shelters.filter((site) => site.city !== unknownCity),
  ...shelters.filter((site) => site.city === unknownCity),
]

/** The three rows the marketing homepage hero shows. Chosen for completeness,
 * one parking lot and two shelters whose city is known, so the hero is not all
 * one kind. */
export const featuredListingIds = [
  "6f2a2ec5-1c51-546e-86b9-1c55b7b53f71", // Shoreline Lot B, Mountain View
  "8745253f-a2b4-57df-928e-4813ddba22af", // Santa Teresa Safe Parking, San Jose
  "29ed0c70-2ca2-5015-8a3b-dee00029493e", // 2000 Geng Road Safe Parking, Palo Alto
]
