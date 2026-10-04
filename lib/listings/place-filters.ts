import type { Freshness, IntakeMethod, SiteKind } from "@/lib/listings/types"
import type { GeoPoint } from "@/lib/listings/geo"
import { defaultOrigin } from "@/lib/listings/geo"

export type DistanceMiles = 2 | 5 | 10 | 20

export type PlaceFilters = {
  kind: "all" | SiteKind
  miles: DistanceMiles | null
  intake: "all" | IntakeMethod
  freshness: "all" | Freshness
  hideFull: boolean
  onlyFits: boolean
  origin: (GeoPoint & { label: string }) | null
}

export const defaultPlaceFilters: PlaceFilters = {
  kind: "all",
  miles: null,
  intake: "all",
  freshness: "all",
  hideFull: true,
  onlyFits: false,
  origin: defaultOrigin,
}

/** The filters the person actually changed.
 *
 * A default is not an applied filter. hideFull ships as true, and the chip row
 * treats "this setting is on" as "the user applied this", so an untouched page
 * shows a "Hide full lots" chip and a badge reading 1. Clear all then restores
 * that same default, the chip and badge come straight back, and Clear all looks
 * broken when it is in fact working.
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
  if (filters.freshness !== defaultPlaceFilters.freshness) keys.push("freshness")
  if (filters.hideFull !== defaultPlaceFilters.hideFull) keys.push("hideFull")
  if (filters.onlyFits !== defaultPlaceFilters.onlyFits) keys.push("onlyFits")

  const originLabel = filters.origin?.label ?? defaultPlaceFilters.origin?.label
  if (originLabel !== defaultPlaceFilters.origin?.label) keys.push("origin")

  return keys
}

/** Nothing to clear. Drives the disabled state on Clear all, so the control is
 * visibly inert instead of appearing to fail. */
export function isDefaultFilters(filters: PlaceFilters): boolean {
  return changedFilterKeys(filters).length === 0
}

const KEY = "true-roof:place-filters:v1"

export function loadPlaceFilters(): PlaceFilters {
  if (typeof window === "undefined") return defaultPlaceFilters

  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return defaultPlaceFilters
    const parsed = JSON.parse(raw) as Partial<PlaceFilters>
    return {
      ...defaultPlaceFilters,
      ...parsed,
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
