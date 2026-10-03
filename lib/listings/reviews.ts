import { createServerSupabaseClient } from "@/lib/supabase/server"
import type {
  ListingReview,
  ListingReviewStats,
  ReviewStatus,
} from "@/lib/listings/types"

type ReviewRow = {
  id: string
  listing_id: string
  user_id: string
  stars: number
  body: string | null
  status: ReviewStatus
  verified_stay: boolean
  created_at: string
  updated_at: string
}

type StatsRow = {
  listing_id: string
  review_count: number
  average_stars: number
}

export function mapReview(row: ReviewRow): ListingReview {
  return {
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    stars: row.stars,
    body: row.body,
    status: row.status,
    verifiedStay: row.verified_stay,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Heuristic spam check for review body. Stars-only reviews are fine. */
export function looksLikeSpam(body: string | null): boolean {
  if (!body) return false
  const text = body.trim()
  if (!text) return false
  if (text.length < 4) return true
  const links = (text.match(/https?:\/\//gi) ?? []).length
  if (links >= 2) return true
  const collapsed = text.toLowerCase().replace(/\s+/g, "")
  if (collapsed.length >= 6) {
    const half = Math.floor(collapsed.length / 2)
    if (collapsed.slice(0, half) === collapsed.slice(half, half * 2)) {
      return true
    }
  }
  return false
}

export async function getPublishedReviewsForListing(
  listingId: string
): Promise<ListingReview[]> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("listing_reviews")
    .select(
      "id, listing_id, user_id, stars, body, status, verified_stay, created_at, updated_at"
    )
    .eq("listing_id", listingId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error || !data) return []
  return (data as ReviewRow[]).map(mapReview)
}

export async function getReviewStatsForListing(
  listingId: string
): Promise<ListingReviewStats | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("listing_review_stats")
    .select("listing_id, review_count, average_stars")
    .eq("listing_id", listingId)
    .maybeSingle()

  if (error || !data) return null
  const row = data as StatsRow
  return {
    listingId: row.listing_id,
    reviewCount: row.review_count,
    averageStars: Number(row.average_stars),
  }
}

export async function getReviewStatsForListings(
  listingIds: string[]
): Promise<Map<string, ListingReviewStats>> {
  const map = new Map<string, ListingReviewStats>()
  if (listingIds.length === 0) return map

  const supabase = await createServerSupabaseClient()
  if (!supabase) return map

  const { data, error } = await supabase
    .from("listing_review_stats")
    .select("listing_id, review_count, average_stars")
    .in("listing_id", listingIds)

  if (error || !data) return map
  for (const row of data as StatsRow[]) {
    map.set(row.listing_id, {
      listingId: row.listing_id,
      reviewCount: row.review_count,
      averageStars: Number(row.average_stars),
    })
  }
  return map
}

export async function getOwnReviewForListing(
  listingId: string
): Promise<ListingReview | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("listing_reviews")
    .select(
      "id, listing_id, user_id, stars, body, status, verified_stay, created_at, updated_at"
    )
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data) return null
  return mapReview(data as ReviewRow)
}

export async function getStaffReviewsForListing(
  listingId: string
): Promise<ListingReview[]> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("listing_reviews")
    .select(
      "id, listing_id, user_id, stars, body, status, verified_stay, created_at, updated_at"
    )
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error || !data) return []
  return (data as ReviewRow[]).map(mapReview)
}

/** Attach published True Roof averages onto listing rows for cards. */
export async function withReviewStats<T extends { id: string }>(
  listings: T[]
): Promise<
  Array<
    T & {
      averageStars?: number | null
      reviewCount?: number | null
    }
  >
> {
  const stats = await getReviewStatsForListings(listings.map((l) => l.id))
  return listings.map((listing) => {
    const row = stats.get(listing.id)
    return {
      ...listing,
      averageStars: row?.averageStars ?? null,
      reviewCount: row?.reviewCount ?? null,
    }
  })
}

export async function getReportCountsForReviews(
  reviewIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (reviewIds.length === 0) return map

  const supabase = await createServerSupabaseClient()
  if (!supabase) return map

  const { data, error } = await supabase
    .from("listing_review_reports")
    .select("review_id")
    .in("review_id", reviewIds)

  if (error || !data) return map
  for (const row of data as { review_id: string }[]) {
    map.set(row.review_id, (map.get(row.review_id) ?? 0) + 1)
  }
  return map
}
