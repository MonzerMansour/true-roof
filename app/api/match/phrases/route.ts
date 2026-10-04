import { NextResponse } from "next/server"

import { embedTexts, isEmbeddingsConfigured } from "@/lib/embeddings/openai"
import { listingToText, needsToText } from "@/lib/embeddings/text"
import { getListingById } from "@/lib/listings/queries"
import type { SeekerNeeds } from "@/lib/matching/needs"
import { pairPhrases, splitSentences } from "@/lib/matching/phrase-similarity"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Developer mode only. Embeds each sentence of the signed-in person's saved
// answers and of one site's text, in a single request, and returns the
// closest site sentence for each of theirs with its cosine score. Runs only
// when a card's breakdown is opened. Stores nothing.
export async function POST(request: Request) {
  const client = await createServerSupabaseClient()
  const user = client ? (await client.auth.getUser()).data.user : null

  if (!client || !user) {
    return NextResponse.json({ reason: "no_account" }, { status: 401 })
  }
  if (!isEmbeddingsConfigured()) {
    return NextResponse.json({ reason: "not_configured" }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as { listingId?: unknown } | null
  const listingId = typeof body?.listingId === "string" ? body.listingId : ""
  if (!listingId) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  const [{ data: need }, found] = await Promise.all([
    client.from("seeker_needs").select("needs").eq("user_id", user.id).maybeSingle(),
    getListingById(listingId),
  ])

  if (!need?.needs || !found) {
    return NextResponse.json({ reason: "not_found" }, { status: 404 })
  }

  try {
    const yours = splitSentences(needsToText(need.needs as SeekerNeeds))
    const theirs = splitSentences(listingToText(found.listing))
    const vectors = await embedTexts([...yours, ...theirs])

    const pairs = pairPhrases(
      yours,
      vectors.slice(0, yours.length),
      theirs,
      vectors.slice(yours.length)
    )

    return NextResponse.json({ pairs })
  } catch (err) {
    console.error("[/api/match/phrases]", err instanceof Error ? err.message : err)
    return NextResponse.json({ reason: "failed" }, { status: 502 })
  }
}
