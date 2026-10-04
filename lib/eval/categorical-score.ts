import type { SeekerNeeds } from "@/lib/matching/needs"
import type { ShelterFixture } from "@/lib/eval/shelter-fixtures"

export type ScoreFactor = {
  label: string
  detail: string
  score: number
}

export type CategoricalResult = {
  score: number
  factors: ScoreFactor[]
}

// A bias layer on top of the raw embedding. Cosine similarity reads
// meaning from free text, but it has no way to know that "pets: any" and
// "no pet" are a perfect fit while "pets: not_allowed" and "a larger pet"
// are not. This scores that agreement directly from the structured fields,
// the same fields lib/matching/hard-filters.ts already treats as ground
// truth, so ranking stops depending only on how well the text happened to
// read. Every factor it checks is returned alongside the score, so a
// person can see exactly which answers pulled the match up or down.
export function categoricalAgreement(
  needs: SeekerNeeds,
  shelter: ShelterFixture
): CategoricalResult {
  const factors: ScoreFactor[] = []

  // Site type versus whether they have a vehicle. The strongest signal:
  // someone with no vehicle gets nothing from a parking lot, and someone
  // sleeping in an RV gets nothing from an indoor-only shelter.
  const needsVehicleSite = needs.vehicle !== "none"
  if (needsVehicleSite) {
    factors.push(
      shelter.kind === "parking"
        ? { label: "Site type", detail: "They have a vehicle, this is safe parking.", score: 1 }
        : { label: "Site type", detail: "They have a vehicle, but this is an indoor shelter.", score: 0.15 }
    )
  } else {
    factors.push(
      shelter.kind === "shelter"
        ? { label: "Site type", detail: "No vehicle, this is an indoor shelter.", score: 1 }
        : { label: "Site type", detail: "No vehicle, but this is a parking lot.", score: 0.2 }
    )
  }

  // Pets, only meaningful for indoor shelters (parking fixtures carry pets: null).
  if (shelter.kind === "shelter") {
    if (shelter.pets === null) {
      factors.push({ label: "Pets", detail: "This site's pet policy is not on file.", score: 0.5 })
    } else if (needs.pet === "none") {
      factors.push({ label: "Pets", detail: "No pet to place, any pet policy works.", score: 1 })
    } else if (needs.pet === "service_animal") {
      factors.push(
        shelter.pets === "not_allowed"
          ? { label: "Pets", detail: "They have a service animal, this site does not allow pets.", score: 0.2 }
          : { label: "Pets", detail: "They have a service animal, this site allows it.", score: 1 }
      )
    } else if (needs.pet === "small_pet") {
      const score =
        shelter.pets === "any" || shelter.pets === "small_pets"
          ? 1
          : shelter.pets === "service_only"
            ? 0.3
            : 0.1
      factors.push({
        label: "Pets",
        detail: `They have a small pet, this site's policy is "${shelter.pets}".`,
        score,
      })
    } else {
      factors.push(
        shelter.pets === "any"
          ? { label: "Pets", detail: "They have a larger pet, this site allows any pet.", score: 1 }
          : { label: "Pets", detail: `They have a larger pet, this site's policy is "${shelter.pets}".`, score: 0.1 }
      )
    }

    // Couples.
    if (needs.household === "with_partner" && shelter.couples) {
      if (shelter.couples === "not_allowed") {
        factors.push({ label: "Couples", detail: "Traveling with a partner, this site does not take couples.", score: 0.1 })
      } else if (needs.partnerRooms === "either" || needs.partnerRooms === shelter.couples) {
        factors.push({ label: "Couples", detail: `Room setup matches: "${shelter.couples}".`, score: 1 })
      } else {
        factors.push({ label: "Couples", detail: `They wanted "${needs.partnerRooms}", this site offers "${shelter.couples}".`, score: 0.4 })
      }
    }
  }

  // Parking-specific: an open lot beats a full or waitlisted one for
  // someone who needs a spot now.
  if (shelter.kind === "parking" && needsVehicleSite) {
    if (shelter.parkingStatus === "open") {
      factors.push({ label: "Parking status", detail: "This lot is open.", score: 1 })
    } else if (shelter.parkingStatus === "waitlist") {
      factors.push({ label: "Parking status", detail: "This lot has a waitlist.", score: 0.5 })
    } else if (shelter.parkingStatus === "full") {
      factors.push({ label: "Parking status", detail: "This lot is full.", score: 0.1 })
    } else {
      factors.push({ label: "Parking status", detail: "This lot's status is not on file.", score: 0.5 })
    }
  }

  const score = factors.reduce((sum, f) => sum + f.score, 0) / factors.length

  return { score, factors }
}

// The blend itself (whichever of text/fields is higher counts more) lives
// in lib/matching/score-blend.ts, shared with the real app so both use the
// same rule.
export { hybridScore } from "@/lib/matching/score-blend"
