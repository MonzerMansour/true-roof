import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Listing } from "@/lib/listings/types"

export type RankSource = "match_listings" | "sort_order"

type MatchRow = { listing_id: string; similarity: number }

// Uses the existing `match_listings` RPC when a signed-in person has an
// embedding. Does not score on its own. If the table is empty or OpenAI
// is not configured, the feed keeps the listing sort_order.
export async function rankPublishedListings(
  listings: Listing[]
): Promise<{ listings: Listing[]; rankedBy: RankSource }> {
  if (listings.length === 0) {
    return { listings, rankedBy: "sort_order" }
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { listings, rankedBy: "sort_order" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { listings, rankedBy: "sort_order" }
  }

  const { data: need, error: needError } = await supabase
    .from("seeker_needs")
    .select("embedding")
    .eq("user_id", user.id)
    .maybeSingle()

  if (needError || !need?.embedding) {
    return { listings, rankedBy: "sort_order" }
  }

  const { data: matches, error: matchError } = await supabase.rpc(
    "match_listings",
    {
      query_embedding: need.embedding,
      match_count: Math.max(listings.length, 10),
    }
  )

  if (matchError || !matches?.length) {
    return { listings, rankedBy: "sort_order" }
  }

  const order = new Map(
    (matches as MatchRow[]).map((row, index) => [row.listing_id, index])
  )

  const ranked = [...listings].sort((a, b) => {
    const ai = order.has(a.id) ? (order.get(a.id) as number) : Number.MAX_SAFE_INTEGER
    const bi = order.has(b.id) ? (order.get(b.id) as number) : Number.MAX_SAFE_INTEGER
    return ai - bi
  })

  return { listings: ranked, rankedBy: "match_listings" }
}
