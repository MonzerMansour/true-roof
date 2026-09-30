import { createClient } from "@supabase/supabase-js"

import { listingSelectTiers } from "@/lib/listings/columns"
import { seedListings } from "@/lib/listings/seed"
import type { DataSource } from "@/lib/listings/sources"
import {
  defaultIntakeMethod,
  normalizeTime,
  type CouplesPolicy,
  type CurfewPolicy,
  type Freshness,
  type IdRequired,
  type IntakeMethod,
  type Listing,
  type MaxStay,
  type ParkingStatus,
  type PetsPolicy,
  type ProjectType,
  type RegistrationRequired,
  type SiteKind,
  type VehicleAllowed,
} from "@/lib/listings/types"

type ListingRow = {
  id: string
  name: string
  kind: SiteKind
  freshness: Freshness
  last_confirmed_at: string
  pets: PetsPolicy | null
  couples: CouplesPolicy | null
  parking_status: ParkingStatus | null
  vehicle_note: string | null
  city: string
  // Present only once 20260927000000_listing_intake.sql has run.
  lat?: number | null
  lng?: number | null
  phone?: string | null
  intake_method?: IntakeMethod | null
  // Present only once 20260928000000_listing_policies.sql has run.
  address?: string | null
  id_required?: IdRequired | null
  curfew_policy?: CurfewPolicy | null
  curfew_time?: string | null
  intake_from?: string | null
  intake_to?: string | null
  max_stay?: MaxStay | null
  pet_weight_limit_lbs?: number | null
  vehicle_allowed?: VehicleAllowed | null
  vehicle_max_length_ft?: number | null
  registration_required?: RegistrationRequired | null
  project_type?: ProjectType | null
  total_beds?: number | null
  data_source?: DataSource | null
  source_url?: string | null
  source_as_of?: string | null
  organizations:
    | { name: string; description: string | null }
    | { name: string; description: string | null }[]
    | null
}

function mapRow(row: ListingRow): Listing {
  const org = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations
  const intake =
    row.intake_method ??
    defaultIntakeMethod({
      freshness: row.freshness,
      kind: row.kind,
      parkingStatus: row.parking_status,
    })

  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    freshness: row.freshness,
    lastConfirmedAt: row.last_confirmed_at,
    pets: row.pets,
    couples: row.couples,
    parkingStatus: row.parking_status,
    vehicleNote: row.vehicle_note,
    city: row.city,
    orgName: org?.name ?? row.name,
    orgDescription: org?.description ?? null,
    address: row.address ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    phone: row.phone ?? null,
    intakeMethod: intake,
    idRequired: row.id_required ?? null,
    curfewPolicy: row.curfew_policy ?? null,
    curfewTime: normalizeTime(row.curfew_time ?? null),
    intakeFrom: normalizeTime(row.intake_from ?? null),
    intakeTo: normalizeTime(row.intake_to ?? null),
    maxStay: row.max_stay ?? null,
    petWeightLimitLbs: row.pet_weight_limit_lbs ?? null,
    vehicleAllowed: row.vehicle_allowed ?? null,
    vehicleMaxLengthFt: row.vehicle_max_length_ft ?? null,
    registrationRequired: row.registration_required ?? null,
    projectType: row.project_type ?? null,
    totalBeds: row.total_beds ?? null,
    dataSource: row.data_source ?? null,
    sourceUrl: row.source_url ?? null,
    sourceAsOf: row.source_as_of ?? null,
  }
}

function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

let warnedAboutTier = false

/** Try the widest select first and fall back to a narrower one, so a project
 * that has not run every migration still serves rows. Falling back means every
 * policy field comes back null, which is indistinguishable from "the source
 * does not publish it", so say so once rather than failing silently. */
async function selectListings(
  build: (select: string) => PromiseLike<{
    error: { message: string } | null
    data: unknown
  }>
) {
  for (let tier = 0; tier < listingSelectTiers.length; tier += 1) {
    const result = await build(listingSelectTiers[tier])
    if (!result.error && result.data) {
      if (tier > 0 && !warnedAboutTier) {
        warnedAboutTier = true
        console.warn(
          "[listings] Falling back to a narrower select. Some columns are missing, so policy fields will read as unpublished. Run `npm run db:setup` to apply every migration."
        )
      }
      return result.data as ListingRow[]
    }
  }

  return null
}

export async function getFeaturedListings(): Promise<{
  listings: Listing[]
  source: "supabase" | "seed"
}> {
  const client = createServerClient()

  if (!client) {
    return { listings: seedListings, source: "seed" }
  }

  const data = await selectListings((select) =>
    client
      .from("listings")
      .select(select)
      .eq("featured", true)
      .eq("published", true)
      .order("sort_order", { ascending: true })
  )

  if (!data) {
    return { listings: seedListings, source: "seed" }
  }

  return {
    listings: data.map(mapRow),
    source: "supabase",
  }
}

export async function getPublishedListings(): Promise<{
  listings: Listing[]
  source: "supabase" | "seed"
}> {
  const client = createServerClient()

  if (!client) {
    return { listings: seedListings, source: "seed" }
  }

  const data = await selectListings((select) =>
    client
      .from("listings")
      .select(select)
      .eq("published", true)
      .order("sort_order", { ascending: true })
  )

  if (!data) {
    return { listings: seedListings, source: "seed" }
  }

  return {
    listings: data.map(mapRow),
    source: "supabase",
  }
}

export async function getListingById(
  id: string
): Promise<{ listing: Listing; source: "supabase" | "seed" } | null> {
  const client = createServerClient()

  if (!client) {
    const listing = seedListings.find((item) => item.id === id)
    return listing ? { listing, source: "seed" } : null
  }

  const data = await selectListings((select) =>
    client
      .from("listings")
      .select(select)
      .eq("id", id)
      .eq("published", true)
      .maybeSingle()
  )

  // maybeSingle returns an object, not an array.
  const row = Array.isArray(data) ? data[0] : (data as ListingRow | null)
  if (row) {
    return { listing: mapRow(row), source: "supabase" }
  }

  const listing = seedListings.find((item) => item.id === id)
  return listing ? { listing, source: "seed" } : null
}
