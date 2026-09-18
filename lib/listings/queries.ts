import { createClient } from "@supabase/supabase-js"

import { seedListings } from "@/lib/listings/seed"
import type {
  CouplesPolicy,
  Freshness,
  Listing,
  ParkingStatus,
  PetsPolicy,
  SiteKind,
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
  organizations: { name: string } | { name: string }[] | null
}

function mapRow(row: ListingRow): Listing {
  const org = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations

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

export async function getFeaturedListings(): Promise<{
  listings: Listing[]
  source: "supabase" | "seed"
}> {
  const client = createServerClient()

  if (!client) {
    return { listings: seedListings, source: "seed" }
  }

  const { data, error } = await client
    .from("listings")
    .select(
      "id, name, kind, freshness, last_confirmed_at, pets, couples, parking_status, vehicle_note, city, organizations(name)"
    )
    .eq("featured", true)
    .order("sort_order", { ascending: true })

  if (error || !data) {
    return { listings: seedListings, source: "seed" }
  }

  return {
    listings: (data as ListingRow[]).map(mapRow),
    source: "supabase",
  }
}
