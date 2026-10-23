// Server only. Never import this from a client component.
//
// Keeps public.listing_embeddings in step with public.listings. Called after a
// site is created or saved in the portal, and by `npm run embeddings:listings`
// for the whole table. Uses the same listingToText() as everything else, so a
// stored embedding always matches what the app would generate.
import { embedText, embeddingModel, isEmbeddingsConfigured } from "@/lib/embeddings/openai"
import { listingToText } from "@/lib/embeddings/text"
import { listingSelectTiers } from "@/lib/listings/columns"
import { mapListingRow, type ListingRow } from "@/lib/listings/queries"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { EmbedOutcome } from "@/lib/embeddings/outcome"

export type { EmbedOutcome }

// One retry, because the usual failure is a rate limit or a blip rather than
// a bad key, and a site that misses matching stays out until someone saves it
// again. A bad key fails both tries and still reports "failed".
async function embedWithRetry(content: string) {
  try {
    return await embedText(content)
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return await embedText(content)
  }
}

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

    const embedding = await embedWithRetry(content)
    // Keyed on listing_id, so this replaces any embedding already stored.
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
