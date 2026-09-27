import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { InterestKind } from "@/lib/listings/types"

export type InterestRow = {
  id: string
  listingId: string
  listingName: string
  kind: InterestKind
  status: "active" | "withdrawn"
  createdAt: string
}

export async function getMyInterest(listingId: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("listing_interest")
    .select("id, listing_id, kind, status, created_at")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .eq("status", "active")

  return (data ?? []) as {
    id: string
    listing_id: string
    kind: InterestKind
    status: "active" | "withdrawn"
    created_at: string
  }[]
}

export async function getMyInterests(): Promise<InterestRow[]> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("listing_interest")
    .select("id, listing_id, kind, status, created_at, listings(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  return (data ?? []).map((row) => {
    const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings
    return {
      id: row.id,
      listingId: row.listing_id,
      listingName: listing?.name ?? "Site",
      kind: row.kind,
      status: row.status,
      createdAt: row.created_at,
    }
  })
}

export async function getInterestForListing(listingId: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data } = await supabase
    .from("listing_interest")
    .select("id, user_id, kind, status, created_at")
    .eq("listing_id", listingId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  return (data ?? []) as {
    id: string
    user_id: string
    kind: InterestKind
    created_at: string
  }[]
}

export async function upsertInterest(listingId: string, kind: InterestKind) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { ok: false as const, error: "Sign-in is not connected." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, error: "Sign in to continue." }
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, published")
    .eq("id", listingId)
    .maybeSingle()

  if (!listing?.published) {
    return { ok: false as const, error: "That site is not on the list." }
  }

  const { error } = await supabase.from("listing_interest").upsert(
    {
      listing_id: listingId,
      user_id: user.id,
      kind,
      status: "active",
    },
    { onConflict: "listing_id,user_id,kind" }
  )

  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
}

export async function withdrawInterest(listingId: string, kind: InterestKind) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { ok: false as const, error: "Sign-in is not connected." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, error: "Sign in to continue." }
  }

  const { error } = await supabase
    .from("listing_interest")
    .update({ status: "withdrawn" })
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .eq("kind", kind)

  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
}
