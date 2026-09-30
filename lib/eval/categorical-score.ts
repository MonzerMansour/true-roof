import type { SeekerNeeds } from "@/lib/matching/needs"
import type { ShelterFixture } from "@/lib/eval/shelter-fixtures"

// A bias layer on top of the raw embedding. Cosine similarity reads
// meaning from free text, but it has no way to know that "pets: any" and
// "no pet" are a perfect fit while "pets: not_allowed" and "a larger pet"
// are not. This scores that agreement directly from the structured fields,
// the same fields lib/matching/hard-filters.ts already treats as ground
// truth, so ranking stops depending only on how well the text happened to
// read.
//
// Returns 0 to 1. 1 means every structured field that applies agrees.
export function categoricalAgreement(needs: SeekerNeeds, shelter: ShelterFixture): number {
  const scores: number[] = []

  // Site type versus whether they have a vehicle. The strongest signal:
  // someone with no vehicle gets nothing from a parking lot, and someone
  // sleeping in an RV gets nothing from an indoor-only shelter.
  const needsVehicleSite = needs.vehicle !== "none"
  if (needsVehicleSite) {
    scores.push(shelter.kind === "parking" ? 1 : 0.15)
  } else {
    scores.push(shelter.kind === "shelter" ? 1 : 0.2)
  }

  // Pets, only meaningful for indoor shelters (parking fixtures carry pets: null).
  if (shelter.kind === "shelter") {
    if (shelter.pets === null) {
      scores.push(0.5)
    } else if (needs.pet === "none") {
      scores.push(1)
    } else if (needs.pet === "service_animal") {
      scores.push(shelter.pets === "not_allowed" ? 0.2 : 1)
    } else if (needs.pet === "small_pet") {
      scores.push(
        shelter.pets === "any" || shelter.pets === "small_pets"
          ? 1
          : shelter.pets === "service_only"
            ? 0.3
            : 0.1
      )
    } else {
      // larger_pet
      scores.push(shelter.pets === "any" ? 1 : 0.1)
    }

    // Couples.
    if (needs.household === "with_partner" && shelter.couples) {
      if (shelter.couples === "not_allowed") {
        scores.push(0.1)
      } else if (needs.partnerRooms === "either") {
        scores.push(1)
      } else if (needs.partnerRooms === shelter.couples) {
        scores.push(1)
      } else {
        scores.push(0.4)
      }
    }
  }

  // Parking-specific: an open lot beats a full or waitlisted one for
  // someone who needs a spot now.
  if (shelter.kind === "parking" && needsVehicleSite) {
    if (shelter.parkingStatus === "open") scores.push(1)
    else if (shelter.parkingStatus === "waitlist") scores.push(0.5)
    else if (shelter.parkingStatus === "full") scores.push(0.1)
    else scores.push(0.5)
  }

  return scores.reduce((sum, s) => sum + s, 0) / scores.length
}

// Weight toward the categorical bonus: this is a matcher for hard-ish
// constraints (pets, vehicle, couples) more than it is a free-text search
// engine, so the structured agreement should carry more of the score than
// the embedding does. Tunable; both stay visible on the eval page so the
// blend is never hidden behind one final number.
export const COSINE_WEIGHT = 0.35
export const CATEGORICAL_WEIGHT = 0.65

export function hybridScore(cosine: number, categorical: number): number {
  return cosine * COSINE_WEIGHT + categorical * CATEGORICAL_WEIGHT
}
