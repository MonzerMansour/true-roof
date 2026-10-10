import type { PartnerRooms, SeekerNeeds } from "@/lib/matching/needs"
import type { CouplesPolicy, Listing, PetsPolicy } from "@/lib/listings/types"

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
          ? { label: "Pets", detail: "You have a service animal, but this site does not allow pets.", score: 0.2 }
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
      })
    } else {
      factors.push(
        listing.pets === "any"
          ? { label: "Pets", detail: "You have a larger pet, and this site allows any pet.", score: 1 }
          : { label: "Pets", detail: `You have a larger pet, but this site ${sitePetRule[listing.pets]}.`, score: 0.1 }
      )
    }

    if (needs.household === "with_partner" && listing.couples) {
      if (listing.couples === "not_allowed") {
        factors.push({ label: "Couples", detail: "You are with a partner, but this site does not take couples.", score: 0.1 })
      } else if (needs.partnerRooms === "either" || !needs.partnerRooms) {
        factors.push({ label: "Couples", detail: `This site ${siteRoomRule[listing.couples]}, and either works for you.`, score: 1 })
      } else if (needs.partnerRooms === listing.couples) {
        factors.push({ label: "Couples", detail: `You want ${wantedRooms[needs.partnerRooms]}, and this site ${siteRoomRule[listing.couples]}.`, score: 1 })
      } else {
        factors.push({ label: "Couples", detail: `You want ${wantedRooms[needs.partnerRooms]}, but this site ${siteRoomRule[listing.couples]}.`, score: 0.4 })
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

  const score = factors.reduce((sum, f) => sum + f.score, 0) / factors.length

  return { score, factors }
}
