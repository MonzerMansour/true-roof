export type GeoPoint = { lat: number; lng: number }

export const cityCenters: Record<string, GeoPoint> = {
  "San Jose": { lat: 37.3382, lng: -121.8863 },
  "Santa Clara": { lat: 37.3541, lng: -121.9552 },
}

export const defaultOrigin: GeoPoint & { label: string } = {
  ...cityCenters["San Jose"],
  label: "Downtown San Jose",
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

export function mapsUrl(point: GeoPoint, name?: string) {
  const query = encodeURIComponent(
    name ? `${name} ${point.lat},${point.lng}` : `${point.lat},${point.lng}`
  )
  return `https://maps.google.com/?q=${query}`
}
