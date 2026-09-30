import { createClient } from "@supabase/supabase-js"

import type {
  CouplesPolicy,
  Listing,
  ParkingStatus,
  PetsPolicy,
  SiteKind,
} from "@/lib/listings/types"

export type RealListingWithEmbedding = {
  listing: Listing
  embedding: number[]
}

type Row = {
  listing_id: string
  embedding: number[] | string
  listings: {
    id: string
    name: string
    kind: SiteKind
    freshness: Listing["freshness"]
    last_confirmed_at: string
    pets: PetsPolicy | null
    couples: CouplesPolicy | null
    parking_status: ParkingStatus | null
    vehicle_note: string | null
    city: string
    intake_method: Listing["intakeMethod"]
    organizations: { name: string; description: string | null } | { name: string; description: string | null }[] | null
  } | null
}

function parseEmbedding(value: number[] | string): number[] {
  return typeof value === "string" ? (JSON.parse(value) as number[]) : value
}

// The 6 real, live-published listings with a real embedding in Supabase,
// read with the anon key (listing_embeddings and listings both allow
// public select). Used only by the /dev/embedding-eval tool, to check the
// synthetic fixtures against actual sites instead of only against each
// other.
export async function loadRealListingsWithEmbeddings(): Promise<
  RealListingWithEmbedding[]
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return []

  const client = createClient(url, key)

  const { data, error } = await client
    .from("listing_embeddings")
    .select(
      "listing_id, embedding, listings!inner(id, name, kind, freshness, last_confirmed_at, pets, couples, parking_status, vehicle_note, city, intake_method, published, organizations(name, description))"
    )
    .eq("listings.published", true)

  if (error || !data) return []

  return (data as unknown as Row[])
    .filter((row) => row.listings)
    .map((row) => {
      const l = row.listings!
      const org = Array.isArray(l.organizations) ? l.organizations[0] : l.organizations

      const listing: Listing = {
        id: l.id,
        name: l.name,
        kind: l.kind,
        freshness: l.freshness,
        lastConfirmedAt: l.last_confirmed_at,
        pets: l.pets,
        couples: l.couples,
        parkingStatus: l.parking_status,
        vehicleNote: l.vehicle_note,
        city: l.city,
        orgName: org?.name ?? l.name,
        orgDescription: org?.description ?? null,
        lat: null,
        lng: null,
        phone: null,
        intakeMethod: l.intake_method,
      }

      return { listing, embedding: parseEmbedding(row.embedding) }
    })
}
