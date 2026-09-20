import { NextResponse } from "next/server"

import { embedText, embeddingModel, isEmbeddingsConfigured } from "@/lib/embeddings/openai"
import { needsToText } from "@/lib/embeddings/text"
import type { SeekerNeeds } from "@/lib/matching/needs"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Stores a signed-in person's questionnaire answers and their embedding.
// Guests have no account, so they get 401 and their answers stay on the phone.
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
    const embedding = await embedText(content)

    const { error } = await client.from("seeker_needs").upsert({
      user_id: user.id,
      needs,
      content,
      embedding: JSON.stringify(embedding),
      model: embeddingModel(),
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    return NextResponse.json({ stored: true })
  } catch {
    return NextResponse.json({ stored: false, reason: "failed" }, { status: 502 })
  }
}
