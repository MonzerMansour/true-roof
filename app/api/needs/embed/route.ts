import { NextResponse } from "next/server"

import { embedText, embeddingModel, isEmbeddingsConfigured } from "@/lib/embeddings/openai"
import { needsToText } from "@/lib/embeddings/text"
import { checkEmbedLimit, recordEmbed } from "@/lib/matching/embed-limit"
import type { SeekerNeeds } from "@/lib/matching/needs"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// At most 5 re-embeds per person per hour (lib/matching/embed-limit.ts).
// Times are kept in the user's app_metadata. Only the service role can write
// it, so a person cannot reset their own count the way they could a column
// on their own seeker_needs row.
const METADATA_KEY = "needs_embed_times"

// Stores a signed-in person's questionnaire answers and their embedding.
// Guests have no account, so they get 401 and their answers stay on the phone.
// Answers that read the same as last time are saved without a new embedding
// and do not count toward the limit.
export async function POST(request: Request) {
  const client = await createServerSupabaseClient()
  const user = client ? (await client.auth.getUser()).data.user : null

  if (!client || !user) {
    return NextResponse.json({ stored: false, reason: "no_account" }, { status: 401 })
  }

  if (!isEmbeddingsConfigured()) {
    return NextResponse.json({ stored: false, reason: "not_configured" }, { status: 503 })
  }

  const needs = (await request.json().catch(() => null)) as SeekerNeeds | null

  if (!needs || typeof needs.daysNeeded !== "number" || !needs.household) {
    return NextResponse.json({ stored: false, reason: "bad_request" }, { status: 400 })
  }

  try {
    const content = needsToText(needs)
    const model = embeddingModel()

    const { data: existing } = await client
      .from("seeker_needs")
      .select("content, model")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing?.content === content && existing?.model === model) {
      const { error } = await client
        .from("seeker_needs")
        .update({ needs, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
      if (error) throw error
      return NextResponse.json({ stored: true, embedded: false })
    }

    const admin = createAdminSupabaseClient()
    const now = Date.now()
    let recent: number[] = []
    let appMetadata: Record<string, unknown> = {}

    if (admin) {
      const { data, error } = await admin.auth.admin.getUserById(user.id)
      if (error) throw error
      appMetadata = data.user?.app_metadata ?? {}
      const limit = checkEmbedLimit(appMetadata[METADATA_KEY], now)
      recent = limit.recent

      if (!limit.allowed) {
        const { retryAfterSeconds } = limit
        return NextResponse.json(
          { stored: false, reason: "rate_limited", retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        )
      }
    } else {
      // Without the service role key the limit cannot be enforced safely.
      console.warn("[/api/needs/embed] SUPABASE_SERVICE_ROLE_KEY not set; rate limit is off.")
    }

    const embedding = await embedText(content)

    const { error } = await client.from("seeker_needs").upsert({
      user_id: user.id,
      needs,
      content,
      embedding: JSON.stringify(embedding),
      model,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    if (admin) {
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...appMetadata,
          [METADATA_KEY]: recordEmbed(recent, now),
        },
      })
    }

    return NextResponse.json({ stored: true, embedded: true })
  } catch (err) {
    console.error("[/api/needs/embed]", err instanceof Error ? err.message : err)
    return NextResponse.json({ stored: false, reason: "failed" }, { status: 502 })
  }
}
