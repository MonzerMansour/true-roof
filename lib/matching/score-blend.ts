import type { ScoreFactor } from "@/lib/matching/categorical-score"

// Shared by the real matcher's display (lib/matching/*) and the dev eval
// tool (lib/eval/*), so both blend and round scores the same way.

export type MatchDetail = {
  cosine: number
  categorical: number
  factors: ScoreFactor[]
  score: number
}

// Round up, never down. With a handful of real sites, not thousands, a
// person should never see a listing undersell itself by a rounding
// fraction. Math.ceil also means "0%" only ever shows for a true zero.
export function roundUpPercent(fraction: number): number {
  return Math.ceil(Math.max(0, Math.min(1, fraction)) * 100)
}

export function formatPercent(fraction: number): string {
  return `${roundUpPercent(fraction)}%`
}

// Raw cosine similarity between two short-sentence embeddings from this
// model does not span the full 0 to 1 range the way a percentage implies.
// In practice, across both the real listings and the synthetic eval set,
// it clusters roughly between 0.2 (no real overlap) and 0.6 (a close
// match). Reading that narrow band as a literal percentage makes even a
// strong match look weak, so it is stretched to the full 0 to 100% range
// using these fixed, observed bounds. They are set once from real data,
// not tuned per question, so this stays honest rather than a way to
// inflate any one answer.
export const TEXT_LENIENCY_FLOOR = 0.2
export const TEXT_LENIENCY_CEILING = 0.6

export function lenientTextScore(cosine: number): number {
  const span = TEXT_LENIENCY_CEILING - TEXT_LENIENCY_FLOOR
  return Math.max(0, Math.min(1, (cosine - TEXT_LENIENCY_FLOOR) / span))
}

// A fixed split, not a per-listing "whichever is higher wins" rule. The
// categorical fields tend to saturate at 100% or drop very low, since
// they are mostly yes/no agreement, which made them dominate and flatten
// every listing's score toward the same number. Text carries more of the
// blend so it can actually move the result.
export const TEXT_WEIGHT = 0.65
export const FIELDS_WEIGHT = 0.35

export function hybridScore(cosine: number, categorical: number): number {
  return lenientTextScore(cosine) * TEXT_WEIGHT + categorical * FIELDS_WEIGHT
}
