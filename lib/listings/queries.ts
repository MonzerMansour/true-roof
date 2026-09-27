import { createClient } from "@supabase/supabase-js"

import { seedListings } from "@/lib/listings/seed"
import { extrasForListing } from "@/lib/listings/testers"
import {
  defaultIntakeMethod,
  type CouplesPolicy,
  type Freshness,
  type IntakeMethod,
  type Listing,
  type ParkingStatus,
  type PetsPolicy,
  type SiteKind,
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
  lat?: number | null
  lng?: number | null
  phone?: string | null
  intake_method?: IntakeMethod | null
  organizations:
    | { name: string; description: string | null }
    | { name: string; description: string | null }[]
    | null
}

const listingSelectBase =
  "id, name, kind, freshness, last_confirmed_at, pets, couples, parking_status, vehicle_note, city, organizations(name, description)"
const listingSelectFull = `${listingSelectBase}, lat, lng, phone, intake_method`

function mapRow(row: ListingRow): Listing {
  const org = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations
  const extras = extrasForListing(row.id)
  const intake =
    row.intake_method ??
    extras?.intakeMethod ??
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
    lat: row.lat ?? extras?.lat ?? null,
    lng: row.lng ?? extras?.lng ?? null,
    phone: row.phone ?? extras?.phone ?? null,
    intakeMethod: intake,
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

async function selectListings(
  build: (select: string) => PromiseLike<{
    error: { message: string } | null
    data: unknown
  }>
) {
  const full = await build(listingSelectFull)
  if (!full.error && full.data) {
    return full.data as ListingRow[]
  }

  const base = await build(listingSelectBase)
  if (!base.error && base.data) {
    return base.data as ListingRow[]
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

  const full = await client
    .from("listings")
    .select(listingSelectFull)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle()

  if (!full.error && full.data) {
    return { listing: mapRow(full.data as ListingRow), source: "supabase" }
  }

  const base = await client
    .from("listings")
    .select(listingSelectBase)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle()

  if (!base.error && base.data) {
    return { listing: mapRow(base.data as ListingRow), source: "supabase" }
  }

  const listing = seedListings.find((item) => item.id === id)
  return listing ? { listing, source: "seed" } : null
}
