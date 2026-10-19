// Server only. Never import this from a client component.
//
// Keeps public.listing_embeddings in step with public.listings. Called after a
// site is created or saved in the portal, and by `npm run embeddings:listings`
// for the whole table. Uses the same listingToText() as everything else, so a
// stored embedding always matches what the app would generate.
import {
  embedText,
  embedTexts,
  embeddingModel,
  isEmbeddingsConfigured,
} from "@/lib/embeddings/openai"
import { listingToText } from "@/lib/embeddings/text"
import { listingSelectTiers } from "@/lib/listings/columns"
import { mapListingRow, type ListingRow } from "@/lib/listings/queries"
import type { Listing } from "@/lib/listings/types"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export type EmbedOutcome = "embedded" | "unchanged" | "skipped" | "failed"

// Re-embeds one listing if its text or the model changed. Never throws: a
// failed embedding must not fail the portal save that triggered it.
export async function syncListingEmbedding(listingId: string): Promise<EmbedOutcome> {
  const admin = createAdminSupabaseClient()
  if (!admin || !isEmbeddingsConfigured()) return "skipped"

  try {
    let row: ListingRow | null = null
    for (const select of listingSelectTiers) {
      const { data, error } = await admin.from("listings").select(select).eq("id", listingId).maybeSingle()
      if (!error) {
        row = (data as ListingRow | null) ?? null
        break
      }
    }
    if (!row) return "skipped"

    const content = listingToText(mapListingRow(row))
    const model = embeddingModel()

    const { data: existing } = await admin
      .from("listing_embeddings")
      .select("content, model")
      .eq("listing_id", listingId)
      .maybeSingle()
    if (existing?.content === content && existing?.model === model) return "unchanged"

    const embedding = await embedText(content)
    const { error } = await admin.from("listing_embeddings").upsert({
      listing_id: listingId,
      content,
      embedding: JSON.stringify(embedding),
      model,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error

    return "embedded"
  } catch (err) {
    console.error("[listing embedding]", listingId, err instanceof Error ? err.message : err)
    return "failed"
  }
}

// The organization's name and description are part of every one of its sites'
// text, so an org edit can change several embeddings at once.
export async function syncOrganizationEmbeddings(organizationId: string) {
  const admin = createAdminSupabaseClient()
  if (!admin || !isEmbeddingsConfigured()) return

  const { data } = await admin.from("listings").select("id").eq("organization_id", organizationId)
  for (const { id } of data ?? []) {
    await syncListingEmbedding(id as string)
  }
}

// Self-healing. When the embedding text changes (a new field joins
// listingToText), every stored embedding is stale until something re-embeds
// it. Places calls this after it has responded, so the deployed site brings
// itself up to date with its own key, a batch per visit, with no one running a
// script. Unchanged rows cost one select and no OpenAI call.
const REFRESH_BATCH = 40
const REFRESH_EVERY_MS = 5 * 60 * 1000
let lastRefresh = 0
let refreshing = false

export async function refreshStaleListingEmbeddings(listings: Listing[]): Promise<number> {
  const now = Date.now()
  if (refreshing || now - lastRefresh < REFRESH_EVERY_MS || listings.length === 0) return 0
  const admin = createAdminSupabaseClient()
  if (!admin || !isEmbeddingsConfigured()) return 0

  refreshing = true
  lastRefresh = now
  try {
    const model = embeddingModel()
    const { data: stored, error } = await admin
      .from("listing_embeddings")
      .select("listing_id, content, model")
    if (error) throw error

    const current = new Map((stored ?? []).map((row) => [row.listing_id as string, row]))
    const stale = listings
      .map((listing) => ({ id: listing.id, content: listingToText(listing) }))
      .filter(({ id, content }) => {
        const row = current.get(id)
        return !row || row.content !== content || row.model !== model
      })
      .slice(0, REFRESH_BATCH)
    if (stale.length === 0) return 0

    const vectors = await embedTexts(stale.map((row) => row.content))
    const updatedAt = new Date().toISOString()
    const { error: upsertError } = await admin.from("listing_embeddings").upsert(
      stale.map((row, i) => ({
        listing_id: row.id,
        content: row.content,
        embedding: JSON.stringify(vectors[i]),
        model,
        updated_at: updatedAt,
      }))
    )
    if (upsertError) throw upsertError

    // More left over: let the next visit pick them up straight away.
    if (stale.length === REFRESH_BATCH) lastRefresh = 0
    return stale.length
  } catch (err) {
    console.error("[listing embeddings refresh]", err instanceof Error ? err.message : err)
    return 0
  } finally {
    refreshing = false
  }
}
