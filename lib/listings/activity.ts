const FAVORITES_KEY = "true-roof:favorites:v1"
const RECENT_KEY = "true-roof:recent-places:v1"
const MAX_RECENT = 12

export type RecentPlace = {
  id: string
  name: string
  city: string
  kind: "shelter" | "parking"
  viewedAt: string
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event("true-roof-activity"))
  } catch {
    // Storage can be full or blocked.
  }
}

export function loadFavorites(): string[] {
  const ids = readJson<string[]>(FAVORITES_KEY, [])
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []
}

export function isFavorite(id: string) {
  return loadFavorites().includes(id)
}

export function toggleFavorite(id: string) {
  const current = loadFavorites()
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [id, ...current]
  writeJson(FAVORITES_KEY, next)
  return next.includes(id)
}

export function loadRecentPlaces(): RecentPlace[] {
  const rows = readJson<RecentPlace[]>(RECENT_KEY, [])
  return Array.isArray(rows) ? rows : []
}

export function recordPlaceView(place: Omit<RecentPlace, "viewedAt">) {
  const next: RecentPlace[] = [
    { ...place, viewedAt: new Date().toISOString() },
    ...loadRecentPlaces().filter((item) => item.id !== place.id),
  ].slice(0, MAX_RECENT)
  writeJson(RECENT_KEY, next)
}

export function subscribeActivity(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => onStoreChange()
  window.addEventListener("storage", handler)
  window.addEventListener("true-roof-activity", handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener("true-roof-activity", handler)
  }
}
