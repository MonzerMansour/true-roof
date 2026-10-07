import type { DataSource } from "@/lib/listings/sources"

// Site side vocabulary. What a shelter or lot offers.
//
// The seeker side lives in lib/matching/needs.ts and is deliberately a
// different vocabulary: a person has a pet, a site allows pets. The two meet
// in lib/matching/vocabulary.ts, nowhere else.
//
// Every enum is a const array with the union derived from it, so the values
// can be enumerated at runtime for form options and for validating FormData.
// A union alone cannot be listed at runtime.
//
// Unknown is always null. There is no "unknown" member in any enum here.

export const siteKindValues = ["shelter", "parking"] as const
export type SiteKind = (typeof siteKindValues)[number]

export const freshnessValues = ["live", "recent", "call_first"] as const
export type Freshness = (typeof freshnessValues)[number]

export const petsPolicyValues = [
  "not_allowed",
  "service_only",
  "small_pets",
  "any",
] as const
export type PetsPolicy = (typeof petsPolicyValues)[number]

export const couplesPolicyValues = [
  "not_allowed",
  "same_room",
  "separate_rooms",
] as const
export type CouplesPolicy = (typeof couplesPolicyValues)[number]

export const parkingStatusValues = ["open", "full", "waitlist"] as const
export type ParkingStatus = (typeof parkingStatusValues)[number]

export const intakeMethodValues = [
  "call",
  "waitlist",
  "register",
  "walk_up",
] as const
export type IntakeMethod = (typeof intakeMethodValues)[number]

export const interestKindValues = [
  "waitlist",
  "register",
  "on_the_way",
] as const
export type InterestKind = (typeof interestKindValues)[number]

// Matches the value set lib/features.ts already promises to providers:
// "ID: required / not required / case by case".
export const idRequiredValues = [
  "required",
  "not_required",
  "case_by_case",
] as const
export type IdRequired = (typeof idRequiredValues)[number]

// Split from curfewTime so "this site has no curfew" is a published fact and
// not indistinguishable from "nobody has told us".
export const curfewPolicyValues = ["no_curfew", "fixed_time"] as const
export type CurfewPolicy = (typeof curfewPolicyValues)[number]

export const maxStayValues = [
  "one_night",
  "up_to_7_nights",
  "up_to_14_nights",
  "up_to_30_nights",
  "up_to_90_nights",
  "up_to_180_nights",
  "no_limit",
] as const
export type MaxStay = (typeof maxStayValues)[number]

export const vehicleAllowedValues = [
  "car_only",
  "car_van",
  "car_van_rv",
] as const
export type VehicleAllowed = (typeof vehicleAllowedValues)[number]

export const registrationRequiredValues = [
  "required",
  "not_required",
  "case_by_case",
] as const
export type RegistrationRequired = (typeof registrationRequiredValues)[number]

// HUD project type. Kept as a fact about the source record. It is NOT a max
// stay: an Emergency Shelter project can be a one night mat or a 90 day bed,
// so max_stay stays null unless the site itself publishes it.
export const projectTypeValues = [
  "emergency_shelter",
  "safe_haven",
  "transitional_housing",
] as const
export type ProjectType = (typeof projectTypeValues)[number]

export type Listing = {
  id: string
  name: string
  kind: SiteKind
  freshness: Freshness
  lastConfirmedAt: string
  pets: PetsPolicy | null
  couples: CouplesPolicy | null
  parkingStatus: ParkingStatus | null
  /** Display only. Never read by the matcher. Structured vehicle facts are
   * vehicleAllowed and vehicleMaxLengthFt. */
  vehicleNote: string | null
  city: string
  orgName: string
  orgDescription?: string | null
  // The site's own description from the portal. Null until staff write one,
  // or until 20261003000100_listing_details.sql is applied.
  description?: string | null
  // A photo staff uploaded in the portal. Null means use a stock photo.
  photoUrl?: string | null
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  intakeMethod: IntakeMethod
  idRequired: IdRequired | null
  curfewPolicy: CurfewPolicy | null
  /** HH:MM, 24 hour. Set only when curfewPolicy is "fixed_time". */
  curfewTime: string | null
  /** HH:MM, 24 hour. intakeTo earlier than intakeFrom means the window wraps
   * past midnight, which is a real shelter pattern. */
  intakeFrom: string | null
  intakeTo: string | null
  maxStay: MaxStay | null
  petWeightLimitLbs: number | null
  vehicleAllowed: VehicleAllowed | null
  vehicleMaxLengthFt: number | null
  registrationRequired: RegistrationRequired | null
  projectType: ProjectType | null
  totalBeds: number | null
  dataSource: DataSource | null
  sourceUrl: string | null
  /** ISO date. When the source last published or a human last checked it. */
  sourceAsOf: string | null
  /** What a lot is like to use. Quoted from the operator, read by a person,
   * never by the matcher. Null means the operator does not publish it. */
  costNote: string | null
  screeningNote: string | null
  requiresDocuments: readonly string[] | null
  facilitiesNote: string | null
  securityNote: string | null
  maxStayNote: string | null
  waitlistNote: string | null
  petsNote: string | null
  /** Staff-entered external average (estimate). Not a live Google sync. */
  externalRating: number | null
  externalRatingCount: number | null
  externalRatingSource: string | null
  /** True Roof published average, filled when review stats are joined. */
  averageStars?: number | null
  reviewCount?: number | null
}

export const reviewStatusValues = [
  "pending",
  "published",
  "rejected",
  "hidden",
] as const
export type ReviewStatus = (typeof reviewStatusValues)[number]

export type ListingReview = {
  id: string
  listingId: string
  userId: string
  stars: number
  body: string | null
  status: ReviewStatus
  verifiedStay: boolean
  createdAt: string
  updatedAt: string
}

export type ListingReviewStats = {
  listingId: string
  averageStars: number
  reviewCount: number
}

export type CustomerReview = {
  id: string
  listingId: string
  reviewerId: string
  subjectUserId: string
  stars: number
  body: string | null
  status: "published" | "hidden"
  createdAt: string
  updatedAt: string
}

// Sentence maps. These read as prose because they feed the embedding text in
// lib/embeddings/text.ts and the fact lists on cards. Do not use them as
// dropdown option labels: see the *Option maps below.

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

// Option maps. Short, sentence case, for Select options and filter chips.
// Object.keys on these drives the provider dropdowns, so a missing entry
// silently removes a choice. lib/listings/types.test.ts guards that.

export const petsOption: Record<PetsPolicy, string> = {
  not_allowed: "Not allowed",
  service_only: "Service animals only",
  small_pets: "Small pets",
  any: "Any pet",
}

export const couplesOption: Record<CouplesPolicy, string> = {
  not_allowed: "Not allowed",
  same_room: "Same room",
  separate_rooms: "Separate rooms",
}

export const idRequiredOption: Record<IdRequired, string> = {
  required: "Required",
  not_required: "Not required",
  case_by_case: "Case by case",
}

export const curfewPolicyOption: Record<CurfewPolicy, string> = {
  no_curfew: "No curfew",
  fixed_time: "Doors lock at a set time",
}

export const maxStayOption: Record<MaxStay, string> = {
  one_night: "One night",
  up_to_7_nights: "Up to 7 nights",
  up_to_14_nights: "Up to 14 nights",
  up_to_30_nights: "Up to 30 nights",
  up_to_90_nights: "Up to 90 nights",
  up_to_180_nights: "Up to 180 nights",
  no_limit: "No set limit",
}

export const vehicleAllowedOption: Record<VehicleAllowed, string> = {
  car_only: "Cars only",
  car_van: "Cars and vans",
  car_van_rv: "Cars, vans, and RVs",
}

export const registrationRequiredOption: Record<RegistrationRequired, string> =
  {
    required: "Required",
    not_required: "Not required",
    case_by_case: "Case by case",
  }

export const projectTypeOption: Record<ProjectType, string> = {
  emergency_shelter: "Emergency shelter",
  safe_haven: "Safe haven",
  transitional_housing: "Transitional housing",
}

// Sentences for the seeker-facing detail rows. Plain language, no jargon.

export const idRequiredLabel: Record<IdRequired, string> = {
  required: "Photo ID required",
  not_required: "No ID needed",
  case_by_case: "ID asked for, but they work with you",
}

export const maxStayLabel: Record<MaxStay, string> = {
  one_night: "One night at a time",
  up_to_7_nights: "Up to 7 nights",
  up_to_14_nights: "Up to 14 nights",
  up_to_30_nights: "Up to 30 nights",
  up_to_90_nights: "Up to 90 nights",
  up_to_180_nights: "Up to 180 nights",
  no_limit: "No set limit on nights",
}

export const vehicleAllowedLabel: Record<VehicleAllowed, string> = {
  car_only: "Cars only, no vans or RVs",
  car_van: "Cars and vans",
  car_van_rv: "Cars, vans, and RVs",
}

export const registrationRequiredLabel: Record<RegistrationRequired, string> = {
  required: "Registration and plates required",
  not_required: "No registration needed",
  case_by_case: "Registration asked for, but they work with you",
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

/** Which Badge variant a freshness value uses. Lives here, next to
 * freshnessLabel, so the card and the detail page cannot disagree. */
export function freshnessTone(
  freshness: Freshness
): "success" | "warning" | "secondary" {
  if (freshness === "live") return "success"
  if (freshness === "recent") return "warning"
  return "secondary"
}

/** Postgres `time` comes back as "HH:MM:SS". The app works in "HH:MM" because
 * that is what the questionnaire collects. */
export function normalizeTime(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : null
}

/** "8:00 PM" from "20:00". The questionnaire shows times this way already. */
export function formatTime(value: string) {
  const [rawHour, minute] = value.split(":")
  const hour = Number(rawHour)
  const suffix = hour < 12 ? "AM" : "PM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${minute} ${suffix}`
}

export function formatIntakeWindow(from: string, to: string) {
  const wraps = to < from
  const window = `${formatTime(from)} to ${formatTime(to)}`
  return wraps ? `${window} (past midnight)` : window
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
  const minutes = Math.max(
    1,
    Math.round((now - new Date(iso).getTime()) / 60000)
  )

  if (minutes < 60) {
    return `Confirmed ${minutes} minute${minutes === 1 ? "" : "s"} ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `Confirmed ${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  const days = Math.round(hours / 24)
  if (days < 365) {
    return `Confirmed ${days} day${days === 1 ? "" : "s"} ago`
  }

  // A county inventory count is over a year old. Say so plainly rather than
  // printing "Confirmed 614 days ago", which reads like a fresh number.
  return "Not confirmed recently. Call before you go."
}
