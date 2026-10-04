import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Listing } from "@/lib/listings/types"
import type { SeekerNeeds } from "@/lib/matching/needs"

export type RankSource = "match_listings" | "sort_order"

type MatchRow = { listing_id: string; similarity: number }

// Uses the existing `match_listings` RPC when a signed-in person has an
// embedding. Does not score on its own. If the table is empty or OpenAI
// is not configured, the feed keeps the listing sort_order.
//
// `similarity` carries the same 0-1 cosine value match_listings() already
// computes in SQL, so the feed can show it. It is not a second matcher and
// it does not change the ranking, it only exposes the number the ranking
// already used. `needs` is returned too so the page can show, display-only,
// how each listing's structured fields agree with the person's answers
// (lib/matching/categorical-score.ts); that breakdown never reorders the
// list, match_listings' cosine score still does that alone.
export async function rankPublishedListings(listings: Listing[]): Promise<{
  listings: Listing[]
  rankedBy: RankSource
  similarity: Map<string, number>
  needs: SeekerNeeds | null
}> {
  if (listings.length === 0) {
    return { listings, rankedBy: "sort_order", similarity: new Map(), needs: null }
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { listings, rankedBy: "sort_order", similarity: new Map(), needs: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { listings, rankedBy: "sort_order", similarity: new Map(), needs: null }
  }

  const { data: need, error: needError } = await supabase
    .from("seeker_needs")
    .select("embedding, needs")
    .eq("user_id", user.id)
    .maybeSingle()

  if (needError || !need?.embedding) {
    return { listings, rankedBy: "sort_order", similarity: new Map(), needs: null }
  }

  const seekerNeeds = (need.needs as SeekerNeeds | null) ?? null

  const { data: matches, error: matchError } = await supabase.rpc(
    "match_listings",
    {
      query_embedding: need.embedding,
      // Every published site. match_listings() caps this at 500 once
      // 20261003000000_match_listings_all_sites.sql is applied (50 before).
      match_count: listings.length,
    }
  )

  if (matchError || !matches?.length) {
    return { listings, rankedBy: "sort_order", similarity: new Map(), needs: seekerNeeds }
  }

  const rows = matches as MatchRow[]
  const order = new Map(rows.map((row, index) => [row.listing_id, index]))
  const similarity = new Map(rows.map((row) => [row.listing_id, row.similarity]))

  const ranked = [...listings].sort((a, b) => {
    const ai = order.has(a.id) ? (order.get(a.id) as number) : Number.MAX_SAFE_INTEGER
    const bi = order.has(b.id) ? (order.get(b.id) as number) : Number.MAX_SAFE_INTEGER
    return ai - bi
  })

  return { listings: ranked, rankedBy: "match_listings", similarity, needs: seekerNeeds }
}
