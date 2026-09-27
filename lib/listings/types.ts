export type SiteKind = "shelter" | "parking"
export type Freshness = "live" | "recent" | "call_first"
export type PetsPolicy = "not_allowed" | "service_only" | "small_pets" | "any"
export type CouplesPolicy = "not_allowed" | "same_room" | "separate_rooms"
export type ParkingStatus = "open" | "full" | "waitlist"
export type IntakeMethod = "call" | "waitlist" | "register" | "walk_up"
export type InterestKind = "waitlist" | "register" | "on_the_way"

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
  orgDescription?: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  intakeMethod: IntakeMethod
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

export const intakeLabel: Record<IntakeMethod, string> = {
  call: "Call first",
  waitlist: "Join waitlist",
  register: "Ask for a bed",
  walk_up: "Walk up",
}

export const interestLabel: Record<InterestKind, string> = {
  waitlist: "Waitlist",
  register: "Asked for a bed",
  on_the_way: "On the way",
}

export function intakeActionLabel(listing: Listing) {
  if (listing.intakeMethod === "call") return "Call"
  if (listing.intakeMethod === "waitlist") return "Join waitlist"
  if (listing.intakeMethod === "walk_up") return "Walk up"
  return listing.kind === "parking" ? "Ask for a spot" : "Ask for a bed"
}

export function defaultIntakeMethod(listing: {
  freshness: Freshness
  kind: SiteKind
  parkingStatus: ParkingStatus | null
}): IntakeMethod {
  if (listing.freshness === "call_first") return "call"
  if (listing.kind === "parking" && listing.parkingStatus === "waitlist") {
    return "waitlist"
  }
  if (listing.kind === "parking" && listing.parkingStatus === "open") {
    return "register"
  }
  if (listing.freshness === "live") return "register"
  return "call"
}

export function formatPhone(tel: string) {
  const digits = tel.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return tel
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
