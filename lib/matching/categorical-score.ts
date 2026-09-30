import type { SeekerNeeds } from "@/lib/matching/needs"
import type { Listing } from "@/lib/listings/types"

export type ScoreFactor = {
  label: string
  detail: string
  score: number
}

export type CategoricalResult = {
  score: number
  factors: ScoreFactor[]
}

// Display-only. This never reorders /places, match_listings' cosine score
// still does that (see lib/matching/rank.ts). It answers a narrower
// question: of the structured fields on this listing, how many agree with
// what the person told us. Same logic as lib/eval/categorical-score.ts,
// kept as a separate copy here since that one is a dev-tool fixture type
// and this one runs against the real Listing shape.
export function categoricalAgreement(
  needs: SeekerNeeds,
  listing: Listing
): CategoricalResult {
  const factors: ScoreFactor[] = []

  const needsVehicleSite = needs.vehicle !== "none"
  if (needsVehicleSite) {
    factors.push(
      listing.kind === "parking"
        ? { label: "Site type", detail: "They have a vehicle, this is safe parking.", score: 1 }
        : { label: "Site type", detail: "They have a vehicle, but this is an indoor shelter.", score: 0.15 }
    )
  } else {
    factors.push(
      listing.kind === "shelter"
        ? { label: "Site type", detail: "No vehicle, this is an indoor shelter.", score: 1 }
        : { label: "Site type", detail: "No vehicle, but this is a parking lot.", score: 0.2 }
    )
  }

  if (listing.kind === "shelter") {
    if (listing.pets === null) {
      factors.push({ label: "Pets", detail: "This site's pet policy is not on file.", score: 0.5 })
    } else if (needs.pet === "none") {
      factors.push({ label: "Pets", detail: "No pet to place, any pet policy works.", score: 1 })
    } else if (needs.pet === "service_animal") {
      factors.push(
        listing.pets === "not_allowed"
          ? { label: "Pets", detail: "They have a service animal, this site does not allow pets.", score: 0.2 }
          : { label: "Pets", detail: "They have a service animal, this site allows it.", score: 1 }
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
        detail: `They have a small pet, this site's policy is "${listing.pets}".`,
        score,
      })
    } else {
      factors.push(
        listing.pets === "any"
          ? { label: "Pets", detail: "They have a larger pet, this site allows any pet.", score: 1 }
          : { label: "Pets", detail: `They have a larger pet, this site's policy is "${listing.pets}".`, score: 0.1 }
      )
    }

    if (needs.household === "with_partner" && listing.couples) {
      if (listing.couples === "not_allowed") {
        factors.push({ label: "Couples", detail: "Traveling with a partner, this site does not take couples.", score: 0.1 })
      } else if (needs.partnerRooms === "either" || needs.partnerRooms === listing.couples) {
        factors.push({ label: "Couples", detail: `Room setup matches: "${listing.couples}".`, score: 1 })
      } else {
        factors.push({ label: "Couples", detail: `They wanted "${needs.partnerRooms}", this site offers "${listing.couples}".`, score: 0.4 })
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
      factors.push({ label: "Parking status", detail: "This lot's status is not on file.", score: 0.5 })
    }
  }

  const score = factors.reduce((sum, f) => sum + f.score, 0) / factors.length

  return { score, factors }
}
