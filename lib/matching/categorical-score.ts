import type { PartnerRooms, SeekerNeeds } from "@/lib/matching/needs"
import {
  maxStayOption,
  type CouplesPolicy,
  type Listing,
  type MaxStay,
  type PetsPolicy,
} from "@/lib/listings/types"
import { findContradictions } from "@/lib/matching/contradictions"
import { formatTime, stayLabel } from "@/lib/matching/needs"

export type ScoreFactor = {
  label: string
  detail: string
  score: number
  /** The two sides say opposite things. Each one cuts the match percent
   * sharply (see conflictPenalty in score-blend.ts). */
  conflict?: boolean
}

export type CategoricalResult = {
  score: number
  factors: ScoreFactor[]
  /** How many factors are outright contradictions. */
  conflicts: number
}

// Display-only. This never reorders /places, match_listings' cosine score
// still does that (see lib/matching/rank.ts). It answers a narrower
// question: of the structured fields on this listing, how many agree with
// what the person told us. Same logic as lib/eval/categorical-score.ts,
// kept as a separate copy here since that one is a dev-tool fixture type
// and this one runs against the real Listing shape.
// Every detail is read by the person themselves, so it speaks to them as
// "you", in plain words. Never put a stored value like "same_room" in a
// sentence; translate it here.
const sitePetRule: Record<PetsPolicy, string> = {
  not_allowed: "does not allow pets",
  service_only: "only allows service animals",
  small_pets: "only allows small pets",
  any: "allows any pet",
}

const siteRoomRule: Record<Exclude<CouplesPolicy, "not_allowed">, string> = {
  same_room: "puts couples in the same room",
  separate_rooms: "puts couples in separate rooms",
}

const wantedRooms: Record<Exclude<PartnerRooms, "either">, string> = {
  same_room: "to share a room",
  separate_rooms: "separate rooms",
}

export function categoricalAgreement(
  needs: SeekerNeeds,
  listing: Listing
): CategoricalResult {
  const factors: ScoreFactor[] = []

  const needsVehicleSite = needs.vehicle !== "none"
  if (needsVehicleSite) {
    factors.push(
      listing.kind === "parking"
        ? { label: "Site type", detail: "You have a vehicle, and this is safe parking.", score: 1 }
        : { label: "Site type", detail: "You have a vehicle, but this is an indoor shelter.", score: 0.15 }
    )
  } else {
    factors.push(
      listing.kind === "shelter"
        ? { label: "Site type", detail: "You do not have a vehicle, and this is an indoor shelter.", score: 1 }
        : { label: "Site type", detail: "You do not have a vehicle, but this is a parking lot.", score: 0.2 }
    )
  }

  if (listing.kind === "shelter") {
    if (listing.pets === null) {
      factors.push({ label: "Pets", detail: "This site has not shared its pet rules yet.", score: 0.5 })
    } else if (needs.pet === "none") {
      factors.push({ label: "Pets", detail: "You have no pet, so the pet rules do not matter here.", score: 1 })
    } else if (needs.pet === "service_animal") {
      factors.push(
        listing.pets === "not_allowed"
          ? { label: "Pets", detail: "You have a service animal, but this site does not allow pets.", score: 0.2, conflict: true }
          : { label: "Pets", detail: "You have a service animal, and this site allows it.", score: 1 }
      )
    } else if (needs.pet === "small_pet") {
      const score =
        listing.pets === "any" || listing.pets === "small_pets"
          ? 1
          : listing.pets === "service_only"
            ? 0.3
            : 0.1
      factors.push({
        label: "Pets",
        detail: `You have a small pet, ${score === 1 ? "and" : "but"} this site ${sitePetRule[listing.pets]}.`,
        score,
        conflict: score < 0.5,
      })
    } else {
      factors.push(
        listing.pets === "any"
          ? { label: "Pets", detail: "You have a larger pet, and this site allows any pet.", score: 1 }
          : { label: "Pets", detail: `You have a larger pet, but this site ${sitePetRule[listing.pets]}.`, score: 0.1, conflict: true }
      )
    }

    if (needs.household === "with_partner" && listing.couples) {
      if (listing.couples === "not_allowed") {
        factors.push({ label: "Couples", detail: "You are with a partner, but this site does not take couples.", score: 0.1, conflict: true })
      } else if (needs.partnerRooms === "either" || !needs.partnerRooms) {
        factors.push({ label: "Couples", detail: `This site ${siteRoomRule[listing.couples]}, and either works for you.`, score: 1 })
      } else if (needs.partnerRooms === listing.couples) {
        factors.push({ label: "Couples", detail: `You want ${wantedRooms[needs.partnerRooms]}, and this site ${siteRoomRule[listing.couples]}.`, score: 1 })
      } else {
        factors.push({ label: "Couples", detail: `You want ${wantedRooms[needs.partnerRooms]}, but this site ${siteRoomRule[listing.couples]}.`, score: 0.4, conflict: true })
      }
    }
  }

  if (listing.kind === "parking" && needsVehicleSite) {
    if (listing.parkingStatus === "open") {
      factors.push({ label: "Parking status", detail: "This lot is open.", score: 1 })
    } else if (listing.parkingStatus === "waitlist") {
      factors.push({ label: "Parking status", detail: "This lot has a waitlist.", score: 0.5 })
    } else if (listing.parkingStatus === "full") {
      factors.push({ label: "Parking status", detail: "This lot is full.", score: 0.1 })
    } else {
      factors.push({ label: "Parking status", detail: "This lot has not shared whether it has space.", score: 0.5 })
    }
  }

  factors.push(...additionalInfoFactors(needs, listing))

  // Where either side's own words say the opposite of the other side.
  for (const contradiction of findContradictions(needs, listing)) {
    factors.push({ label: "In your words", detail: contradiction.detail, score: 0, conflict: true })
  }

  const score = factors.reduce((sum, f) => sum + f.score, 0) / factors.length
  const conflicts = factors.filter((f) => f.conflict).length

  return { score, factors, conflicts }
}

// The longest stay, in nights, for each option a site can publish.
const maxStayNights: Record<MaxStay, number> = {
  one_night: 1,
  up_to_7_nights: 7,
  up_to_14_nights: 14,
  up_to_30_nights: 30,
  up_to_90_nights: 90,
  up_to_180_nights: 180,
  no_limit: Number.POSITIVE_INFINITY,
}

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Evening clock: 1 AM is later than 11 PM. Used for "let in by" and curfew. */
function eveningMinutes(hhmm: string) {
  const value = minutes(hhmm)
  return value < 6 * 60 ? value + 24 * 60 : value
}

/** A window as [start, end] minutes, with an end before its start running
 * past midnight, which is a real shelter pattern. */
function windowOf(from: string, to: string): [number, number] {
  const start = minutes(from)
  let end = minutes(to)
  if (end < start) end += 24 * 60
  return [start, end]
}

function windowsOverlap(a: [number, number], b: [number, number]) {
  // Try the second window as given and shifted a day either way, so a
  // window past midnight still meets one that starts after midnight.
  return [-1440, 0, 1440].some((shift) => a[0] <= b[1] + shift && b[0] + shift <= a[1])
}

/**
 * The site's Additional info against the matching survey answers. Only
 * compared when both sides answered: a rule the site has not published is
 * never a conflict.
 */
function additionalInfoFactors(needs: SeekerNeeds, listing: Listing): ScoreFactor[] {
  const factors: ScoreFactor[] = []

  if (listing.idRequired) {
    const noId = needs.idStatus !== "have_id"
    if (listing.idRequired === "required" && noId) {
      factors.push({
        label: "Photo ID",
        detail: "You do not have photo ID yet, but this site requires it.",
        score: 0,
        conflict: true,
      })
    } else if (listing.idRequired === "case_by_case" && noId) {
      factors.push({ label: "Photo ID", detail: "You do not have photo ID yet, and this site can work with that.", score: 0.8 })
    } else {
      factors.push({ label: "Photo ID", detail: "Photo ID is not a problem here.", score: 1 })
    }
  }

  if (listing.intakeFrom && listing.intakeTo && needs.arrivalFrom && needs.arrivalTo) {
    const theirs = windowOf(needs.arrivalFrom, needs.arrivalTo)
    const site = windowOf(listing.intakeFrom, listing.intakeTo)
    const window = `${formatTime(listing.intakeFrom)} to ${formatTime(listing.intakeTo)}`
    factors.push(
      windowsOverlap(theirs, site)
        ? { label: "Check-in", detail: `You can get there while check-in is open, ${window}.`, score: 1 }
        : {
            label: "Check-in",
            detail: `You can get there ${formatTime(needs.arrivalFrom)} to ${formatTime(needs.arrivalTo)}, but check-in here is ${window}.`,
            score: 0,
            conflict: true,
          }
    )
  }

  if (needs.latestEntry && listing.curfewPolicy) {
    if (listing.curfewPolicy === "no_curfew") {
      factors.push({ label: "Late entry", detail: "This site has no curfew, so getting in late works.", score: 1 })
    } else if (listing.curfewTime) {
      const late = eveningMinutes(needs.latestEntry) > eveningMinutes(listing.curfewTime)
      factors.push(
        late
          ? {
              label: "Late entry",
              detail: `You need to get in by ${formatTime(needs.latestEntry)}, but doors lock at ${formatTime(listing.curfewTime)}.`,
              score: 0,
              conflict: true,
            }
          : { label: "Late entry", detail: `Doors lock at ${formatTime(listing.curfewTime)}, which fits when you need to get in.`, score: 1 }
      )
    }
  }

  if (listing.maxStay && needs.daysNeeded) {
    const tooShort = needs.daysNeeded > maxStayNights[listing.maxStay]
    factors.push(
      tooShort
        ? {
            label: "Length of stay",
            detail: `You need ${stayLabel(needs.daysNeeded).toLowerCase()}, but the longest stay here is ${maxStayOption[listing.maxStay].toLowerCase()}.`,
            score: 0.2,
            conflict: true,
          }
        : { label: "Length of stay", detail: "You can stay as long as you need here.", score: 1 }
    )
  }

  if (
    listing.kind === "shelter" &&
    listing.pets === "small_pets" &&
    listing.petWeightLimitLbs &&
    needs.petWeightLbs &&
    (needs.pet === "small_pet" || needs.pet === "larger_pet")
  ) {
    const tooHeavy = needs.petWeightLbs > listing.petWeightLimitLbs
    factors.push(
      tooHeavy
        ? {
            label: "Pet size",
            detail: `Your pet is about ${needs.petWeightLbs} pounds, but this site takes pets up to ${listing.petWeightLimitLbs} pounds.`,
            score: 0,
            conflict: true,
          }
        : { label: "Pet size", detail: `Your pet is under this site's ${listing.petWeightLimitLbs} pound limit.`, score: 1 }
    )
  }

  if (listing.kind === "parking" && needs.vehicle !== "none") {
    if (listing.vehicleAllowed) {
      if (needs.vehicle === "rv_van" && listing.vehicleAllowed === "car_only") {
        factors.push({ label: "Vehicle", detail: "You have an RV or van, but this lot only takes cars.", score: 0, conflict: true })
      } else if (needs.vehicle === "rv_van" && listing.vehicleAllowed === "car_van") {
        factors.push({ label: "Vehicle", detail: "This lot takes vans but not RVs. Check which you have.", score: 0.6 })
      } else {
        factors.push({ label: "Vehicle", detail: "This lot takes your kind of vehicle.", score: 1 })
      }
    }

    if (needs.vehicleSize === "large" && listing.vehicleMaxLengthFt && listing.vehicleMaxLengthFt < 20) {
      factors.push({
        label: "Vehicle length",
        detail: `Your vehicle is longer than a normal space, but this lot takes vehicles up to ${listing.vehicleMaxLengthFt} feet.`,
        score: 0,
        conflict: true,
      })
    }

    if (listing.registrationRequired === "required" && needs.vehicleRegistered && needs.vehicleRegistered !== "yes") {
      const unsure = needs.vehicleRegistered === "not_sure"
      factors.push({
        label: "Registration",
        detail: unsure
          ? "You are not sure your vehicle is registered, and this lot requires it."
          : "Your vehicle is not registered, but this lot requires it.",
        score: unsure ? 0.5 : 0,
        conflict: !unsure,
      })
    }
  }

  return factors
}
