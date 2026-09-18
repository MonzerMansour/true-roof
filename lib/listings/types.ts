export type SiteKind = "shelter" | "parking"
export type Freshness = "live" | "recent" | "call_first"
export type PetsPolicy = "not_allowed" | "service_only" | "small_pets" | "any"
export type CouplesPolicy = "not_allowed" | "same_room" | "separate_rooms"
export type ParkingStatus = "open" | "full" | "waitlist"

export type Listing = {
  id: string
  name: string
  kind: SiteKind
  freshness: Freshness
  lastConfirmedAt: string
  pets: PetsPolicy | null
  couples: CouplesPolicy | null
  parkingStatus: ParkingStatus | null
  vehicleNote: string | null
  city: string
  orgName: string
}

export const petsLabel: Record<PetsPolicy, string> = {
  not_allowed: "pets: not allowed",
  service_only: "pets: service animals only",
  small_pets: "pets: small pets under a weight limit",
  any: "pets: any pet",
}

export const couplesLabel: Record<CouplesPolicy, string> = {
  not_allowed: "couples: not allowed",
  same_room: "couples: same room",
  separate_rooms: "couples: separate rooms",
}

export const freshnessLabel: Record<Freshness, string> = {
  live: "Live",
  recent: "Recent",
  call_first: "Call first",
}

export const parkingStatusLabel: Record<ParkingStatus, string> = {
  open: "Open",
  full: "Full",
  waitlist: "Waitlist",
}

export function formatConfirmedAt(iso: string, now = Date.now()) {
  const minutes = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000))

  if (minutes < 60) {
    return `Confirmed ${minutes} minute${minutes === 1 ? "" : "s"} ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `Confirmed ${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  const days = Math.round(hours / 24)
  return `Confirmed ${days} day${days === 1 ? "" : "s"} ago`
}
