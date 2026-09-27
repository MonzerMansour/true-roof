import type { SeekerNeeds } from "@/lib/matching/needs"
import type { Listing } from "@/lib/listings/types"

export type FitResult = {
  fits: boolean
  reasons: string[]
}

// Hard constraints remove a listing. This is not the ranking model.
// Ranking still lives in `match_listings` (SQL) when embeddings exist.
export function listingFitsNeeds(
  listing: Listing,
  needs: SeekerNeeds | null
): FitResult {
  if (!needs) {
    return { fits: true, reasons: [] }
  }

  const reasons: string[] = []

  if (needs.pet === "service_animal" && listing.pets === "not_allowed") {
    reasons.push("This site does not take pets, including service animals.")
  }

  if (needs.pet === "small_pet" && listing.pets && listing.pets === "not_allowed") {
    reasons.push("This site does not take pets.")
  }

  if (
    needs.pet === "small_pet" &&
    listing.pets &&
    listing.pets === "service_only"
  ) {
    reasons.push("This site only takes service animals.")
  }

  if (
    needs.pet === "larger_pet" &&
    listing.pets &&
    listing.pets !== "any"
  ) {
    reasons.push("This site does not take a larger pet.")
  }

  if (needs.household === "with_partner") {
    if (listing.couples === "not_allowed") {
      reasons.push("This site does not take couples.")
    } else if (
      needs.partnerRooms === "same_room" &&
      listing.couples === "separate_rooms"
    ) {
      reasons.push("This site only has separate rooms for partners.")
    } else if (
      needs.partnerRooms === "separate_rooms" &&
      listing.couples === "same_room"
    ) {
      reasons.push("This site only has a shared room for partners.")
    }
  }

  if (needs.vehicle === "none" && listing.kind === "parking") {
    reasons.push("Safe parking is for people sleeping in a car or RV.")
  }

  if (listing.kind === "parking" && listing.parkingStatus === "full") {
    reasons.push("This lot is full.")
  }

  return { fits: reasons.length === 0, reasons }
}
