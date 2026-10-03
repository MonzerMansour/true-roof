"use server"

import { revalidatePath } from "next/cache"

import { looksLikeSpam } from "@/lib/listings/reviews"
import type { ReviewStatus } from "@/lib/listings/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type ReviewActionResult =
  | { ok: true; status: ReviewStatus }
  | { ok: false; error: string }

const MAX_BODY = 600
const MAX_SUBMITS_PER_DAY = 3

async function requireSeeker(): Promise<
  | {
      ok: true
      supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>
      user: { id: string }
    }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { ok: false, error: "Sign in is not configured." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Sign in to leave a review." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role === "provider") {
    return {
      ok: false,
      error:
        "Shelter staff moderate reviews. They do not leave seeker reviews.",
    }
  }

  return { ok: true, supabase, user }
}

async function hasVerifiedStay(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  listingId: string,
  userId: string
) {
  const { data } = await supabase
    .from("listing_interest")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("kind", ["register", "on_the_way", "waitlist"])
    .limit(1)

  return (data?.length ?? 0) > 0
}

async function submissionsToday(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  userId: string
) {
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase
    .from("listing_reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())

  return count ?? 0
}

async function rejectedCount(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  userId: string
) {
  const { count } = await supabase
    .from("listing_reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "rejected")

  return count ?? 0
}

export async function upsertListingReview(
  formData: FormData
): Promise<ReviewActionResult> {
  const auth = await requireSeeker()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { supabase, user } = auth
  const listingId = String(formData.get("listingId") ?? "").trim()
  const starsRaw = Number(formData.get("stars"))
  const bodyRaw = String(formData.get("body") ?? "").trim()
  const body = bodyRaw ? bodyRaw.slice(0, MAX_BODY) : null

  if (!listingId) return { ok: false, error: "Missing listing." }
  if (!Number.isInteger(starsRaw) || starsRaw < 1 || starsRaw > 5) {
    return { ok: false, error: "Pick a star rating from 1 to 5." }
  }

  const { data: existing } = await supabase
    .from("listing_reviews")
    .select("id, created_at")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existing) {
    const today = await submissionsToday(supabase, user.id)
    if (today >= MAX_SUBMITS_PER_DAY) {
      return {
        ok: false,
        error: "You can leave up to 3 new reviews per day. Try again tomorrow.",
      }
    }
  }

  const verifiedStay = await hasVerifiedStay(supabase, listingId, user.id)
  const spam = looksLikeSpam(body)
  const manyRejected = (await rejectedCount(supabase, user.id)) >= 3
  const status: ReviewStatus =
    spam || manyRejected ? "pending" : "published"

  const payload = {
    listing_id: listingId,
    user_id: user.id,
    stars: starsRaw,
    body,
    status,
    verified_stay: verifiedStay,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing
    ? await supabase
        .from("listing_reviews")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("listing_reviews").insert(payload)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/places/${listingId}`)
  revalidatePath("/places")
  return { ok: true, status }
}

export async function withdrawOwnReview(
  listingId: string
): Promise<ReviewActionResult> {
  const auth = await requireSeeker()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { supabase, user } = auth
  const { error } = await supabase
    .from("listing_reviews")
    .update({
      status: "hidden",
      updated_at: new Date().toISOString(),
    })
    .eq("listing_id", listingId)
    .eq("user_id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/places/${listingId}`)
  return { ok: true, status: "hidden" }
}

export async function reportListingReview(
  formData: FormData
): Promise<ReviewActionResult | { ok: true }> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return { ok: false, error: "Sign in is not configured." }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Sign in to report a review." }

  const reviewId = String(formData.get("reviewId") ?? "").trim()
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200)
  if (!reviewId || !reason) {
    return { ok: false, error: "Say why you are reporting this." }
  }

  const { error } = await supabase.from("listing_review_reports").upsert(
    {
      review_id: reviewId,
      reporter_id: user.id,
      reason,
    },
    { onConflict: "review_id,reporter_id" }
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
