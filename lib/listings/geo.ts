export type GeoPoint = { lat: number; lng: number }

/** The city a new site defaults to. listings.city is NOT NULL with this as its
 * SQL default, and it used to be typed out in five separate places. */
export const defaultCity = "San Jose"

// City centroids, used two ways: as the origin a person measures from, and as
// a fallback position for a listing whose exact coordinates are not published.
//
// Every city that appears in the shelter data needs an entry here. Without one,
// lib/listings/queries.ts would fall back to downtown San Jose and the distance
// shown for a Gilroy or Palo Alto site would be wrong by 20 miles or more.
export const cityCenters: Record<string, GeoPoint> = {
  "San Jose": { lat: 37.3382, lng: -121.8863 },
  "Santa Clara": { lat: 37.3541, lng: -121.9552 },
  "Mountain View": { lat: 37.3861, lng: -122.0839 },
  "Palo Alto": { lat: 37.4419, lng: -122.143 },
  Sunnyvale: { lat: 37.3688, lng: -122.0363 },
  Milpitas: { lat: 37.4323, lng: -121.8996 },
  Cupertino: { lat: 37.323, lng: -122.0322 },
  Campbell: { lat: 37.2872, lng: -121.95 },
  "Los Gatos": { lat: 37.2358, lng: -121.9624 },
  "Los Altos": { lat: 37.3852, lng: -122.1141 },
  Saratoga: { lat: 37.2638, lng: -122.023 },
  "Morgan Hill": { lat: 37.1305, lng: -121.6544 },
  Gilroy: { lat: 37.0058, lng: -121.5683 },
}

export const defaultOrigin: GeoPoint & { label: string } = {
  ...cityCenters["San Jose"],
  label: "Downtown San Jose",
}

/** How much to trust a listing's position.
 *
 * "site" means the site's own coordinates. "city" means we only know which
 * city it is in, so the distance is measured from that city's centre and must
 * be labelled as approximate. "unknown" means we cannot place it at all.
 *
 * This exists because HUD's inventory count publishes no addresses. Most real
 * rows are "city" or "unknown", and showing a city level estimate as though it
 * were a street level one would be a lie a person could act on. */
export type DistanceBasis = "site" | "city" | "unknown"

export function listingPoint(listing: {
  lat: number | null
  lng: number | null
  city: string
}): { point: GeoPoint | null; basis: DistanceBasis } {
  if (listing.lat != null && listing.lng != null) {
    return { point: { lat: listing.lat, lng: listing.lng }, basis: "site" }
  }

  const center = cityCenters[listing.city]
  if (center) {
    return { point: center, basis: "city" }
  }

  return { point: null, basis: "unknown" }
}

export function milesBetween(a: GeoPoint, b: GeoPoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const r = 3958.8
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatMiles(miles: number) {
  if (miles < 0.1) return "Under 0.1 mi"
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

/** Distance text that says how sure we are. A city level estimate reads
 * "about 8 mi to Gilroy", never "8.0 mi", so nobody plans a walk around it. */
export function formatDistance(
  miles: number | null,
  basis: DistanceBasis,
  city: string
) {
  if (miles == null || basis === "unknown") return "Distance not known"
  if (basis === "city") return `about ${Math.round(miles)} mi to ${city}`
  return formatMiles(miles)
}

export function mapsUrl(point: GeoPoint, name?: string) {
  const query = encodeURIComponent(
    name ? `${name} ${point.lat},${point.lng}` : `${point.lat},${point.lng}`
  )
  return `https://maps.google.com/?q=${query}`
}
