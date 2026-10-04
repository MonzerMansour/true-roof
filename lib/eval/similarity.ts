import { categoricalAgreement, hybridScore, type ScoreFactor } from "@/lib/eval/categorical-score"
import type { SeekerNeeds } from "@/lib/matching/needs"
import type { ShelterFixture } from "@/lib/eval/shelter-fixtures"

// Cosine similarity, the same measure Supabase's match_listings() uses via
// pgvector's <=> operator.
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export type RankedShelter = {
  id: string
  name: string
  description: string
  cosine: number
  categorical: number
  factors: ScoreFactor[]
  score: number
}

export function rankSheltersForNeeds(
  needs: SeekerNeeds,
  needsEmbedding: number[],
  shelters: {
    id: string
    name: string
    description: string
    embedding: number[]
    fixture: ShelterFixture
  }[]
): RankedShelter[] {
  return shelters
    .map((shelter) => {
      const cosine = cosineSimilarity(needsEmbedding, shelter.embedding)
      const { score: categorical, factors } = categoricalAgreement(needs, shelter.fixture)

      return {
        id: shelter.id,
        name: shelter.name,
        description: shelter.description,
        cosine,
        categorical,
        factors,
        score: hybridScore(cosine, categorical),
      }
    })
    .sort((a, b) => b.score - a.score)
}
