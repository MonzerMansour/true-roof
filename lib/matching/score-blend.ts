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
// Measured on the 93 real CA-500 sites against a real person's answers
// (Oct 2026), it ran from about 0.29 to 0.48, median 0.31. The old 0.2 to 0.6
// band showed that median as 28% and the best site as 69%, which read as
// "poor match" for sites that were the closest available.
//
// So the band is stretched from 0.15 to 0.45, then lifted by a curve
// (exponent below 1) that raises the middle more than the ends. The order of
// sites never changes: a higher cosine always shows a higher percent. Only
// the label is more lenient. On the measured data the median now reads about
// 69%, the weakest 64%, and the best 100%.
export const TEXT_LENIENCY_FLOOR = 0.15
export const TEXT_LENIENCY_CEILING = 0.45
export const TEXT_LENIENCY_CURVE = 0.6

export function lenientTextScore(cosine: number): number {
  const span = TEXT_LENIENCY_CEILING - TEXT_LENIENCY_FLOOR
  const linear = Math.max(0, Math.min(1, (cosine - TEXT_LENIENCY_FLOOR) / span))
  return Math.pow(linear, TEXT_LENIENCY_CURVE)
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
