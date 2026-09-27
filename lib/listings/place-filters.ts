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
