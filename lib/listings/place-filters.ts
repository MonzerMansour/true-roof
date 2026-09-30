import type { Freshness, IntakeMethod, SiteKind } from "@/lib/listings/types"
import type { GeoPoint } from "@/lib/listings/geo"
import { defaultOrigin } from "@/lib/listings/geo"

export type DistanceMiles = 2 | 5 | 10 | 20

/** How much of the list to show, given the person's answers.
 *
 * This replaced a boolean `onlyFits` that defaulted to false, which meant hard
 * constraints removed nothing at all and a site that could not take your dog
 * still appeared with a red badge.
 *
 *   "possible"  (default) hides only sites a published rule rules out.
 *   "confirmed" shows only sites where every rule you named is published and
 *               compatible. A short, certain list.
 *   "all"       shows the removed ones too, each with the reason.
 *
 * Three values rather than a flipped boolean because most rows come from HUD's
 * county bed count, which publishes no rules at all. A strict two-state filter
 * would either empty the feed or hide nothing.
 */
export type FitFilter = "all" | "possible" | "confirmed"

export type PlaceFilters = {
  kind: "all" | SiteKind
  miles: DistanceMiles | null
  intake: "all" | IntakeMethod
  freshness: "all" | Freshness
  hideFull: boolean
  fit: FitFilter
  origin: (GeoPoint & { label: string }) | null
}

export const defaultPlaceFilters: PlaceFilters = {
  kind: "all",
  miles: null,
  intake: "all",
  freshness: "all",
  hideFull: true,
  fit: "possible",
  origin: defaultOrigin,
}

export const fitFilterLabel: Record<FitFilter, string> = {
  possible: "Could work",
  confirmed: "Confirmed fit",
  all: "Everything",
}

// Bumped from v1. The stored shape changed, and loadPlaceFilters spreads the
// saved object over the defaults, so an old blob's onlyFits: false would have
// survived as dead junk and kept the old behaviour forever.
//
// Note that true-roof:seeker-needs is deliberately NOT bumped: a filter blob is
// disposable, but the needs blob is ten answered questions.
/** The filters the person actually changed.
 *
 * A default is not an applied filter. hideFull ships as true, and the chip row
 * used to treat "this setting is on" as "the user applied this", so a page
 * nobody had touched showed a "Hide full lots" chip and a badge reading 1.
 * Clear all then restored that same default, the chip and the badge came
 * straight back, and both Clear all and Reset looked broken.
 *
 * origin is compared by label: two GeoPoints can hold equal coordinates and
 * still be a different choice ("Near me" versus "Downtown San Jose"). */
export function changedFilterKeys(
  filters: PlaceFilters
): (keyof PlaceFilters)[] {
  const keys: (keyof PlaceFilters)[] = []

  if (filters.kind !== defaultPlaceFilters.kind) keys.push("kind")
  if (filters.miles !== defaultPlaceFilters.miles) keys.push("miles")
  if (filters.intake !== defaultPlaceFilters.intake) keys.push("intake")
  if (filters.freshness !== defaultPlaceFilters.freshness)
    keys.push("freshness")
  if (filters.hideFull !== defaultPlaceFilters.hideFull) keys.push("hideFull")
  if (filters.fit !== defaultPlaceFilters.fit) keys.push("fit")

  const originLabel = filters.origin?.label ?? defaultPlaceFilters.origin?.label
  if (originLabel !== defaultPlaceFilters.origin?.label) keys.push("origin")

  return keys
}

/** Nothing to clear. Drives the disabled state on Clear all, so the control is
 * visibly inert instead of appearing to fail. */
export function isDefaultFilters(filters: PlaceFilters): boolean {
  return changedFilterKeys(filters).length === 0
}

const KEY = "true-roof:place-filters:v2"

export function loadPlaceFilters(): PlaceFilters {
  if (typeof window === "undefined") return defaultPlaceFilters

  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return defaultPlaceFilters
    const parsed = JSON.parse(raw) as Partial<PlaceFilters>
    return {
      ...defaultPlaceFilters,
      ...parsed,
      // A saved value from a hand edited blob must not become the filter.
      fit:
        parsed.fit === "all" ||
        parsed.fit === "confirmed" ||
        parsed.fit === "possible"
          ? parsed.fit
          : defaultPlaceFilters.fit,
      origin: parsed.origin ?? defaultPlaceFilters.origin,
    }
  } catch {
    return defaultPlaceFilters
  }
}

export function savePlaceFilters(filters: PlaceFilters) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(filters))
  } catch {
    // Storage can be full or blocked.
  }
}
