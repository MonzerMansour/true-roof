import {
  householdLabel,
  idLabel,
  formatTime,
  latestEntryLabel,
  partnerRoomsLabel,
  petLabel,
  stayLabel,
  vehicleLabel,
  vehicleRegisteredLabel,
  vehicleSizeLabel,
  type SeekerNeeds,
} from "@/lib/matching/needs"
import { couplesLabel, petsLabel, type Listing } from "@/lib/listings/types"

// Plain sentences embed better than JSON. Keep both builders in the same
// vocabulary so a seeker and a site land near each other.

export function needsToText(needs: SeekerNeeds) {
  const lines = [
    `Household: ${householdLabel[needs.household]}.`,
    needs.partnerRooms
      ? `Partner rooms: ${partnerRoomsLabel[needs.partnerRooms]}.`
      : null,
    `Pet: ${petLabel[needs.pet]}${
      needs.petWeightLbs ? `, about ${needs.petWeightLbs} pounds` : ""
    }.`,
    `Photo ID: ${idLabel[needs.idStatus]}.`,
    `Vehicle: ${vehicleLabel[needs.vehicle]}.`,
    needs.vehicleSize ? `Vehicle size: ${vehicleSizeLabel[needs.vehicleSize]}.` : null,
    needs.vehicleRegistered
      ? `Vehicle registered: ${vehicleRegisteredLabel[needs.vehicleRegistered]}.`
      : null,
    `Can check in between ${formatTime(needs.arrivalFrom)} and ${formatTime(needs.arrivalTo)}.`,
    `Needs late entry: ${latestEntryLabel(needs.latestEntry)}.`,
    `Bed needed: ${stayLabel(needs.daysNeeded)}.`,
    // Free text, one sentence, always last so the categorical fields above
    // dominate the embedding and this only nudges the ranking.
    needs.placeNote?.trim() ? `What they said in their own words: "${needs.placeNote.trim()}".` : null,
  ]

  return lines.filter(Boolean).join(" ")
}

export function listingToText(listing: Listing) {
  const lines = [
    `${listing.kind === "shelter" ? "Shelter" : "Safe parking"}: ${listing.name}, run by ${listing.orgName}, in ${listing.city}.`,
    listing.pets ? `${petsLabel[listing.pets]}.` : null,
    listing.couples ? `${couplesLabel[listing.couples]}.` : null,
    listing.parkingStatus ? `Parking status: ${listing.parkingStatus}.` : null,
    listing.vehicleNote ? `Vehicles: ${listing.vehicleNote}.` : null,
    // Free text the provider wrote, one short note, always last for the
    // same reason: categorical fields carry the match, this only nudges it.
    listing.orgDescription?.trim() ? `What the site says about itself: "${listing.orgDescription.trim()}".` : null,
  ]

  return lines.filter(Boolean).join(" ")
}
