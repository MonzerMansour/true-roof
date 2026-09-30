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
    // Free text, one sentence, labeled clearly as location and community
    // preference so the embedding model reads it as its own category
    // (near a park, close to transit, a quiet block) rather than a loose
    // trailing quote. The categorical fields above still get checked
    // separately (lib/matching/categorical-score.ts); this is the part
    // that carries a person's actual words into the text match.
    needs.placeNote?.trim()
      ? `Location and community preference, in their own words: "${needs.placeNote.trim()}".`
      : null,
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
    // Same "location and community" framing as needsToText(), so a
    // seeker's "near a park" and a site's "next to a public park" land in
    // the same part of the sentence rather than two differently shaped
    // trailing quotes.
    listing.orgDescription?.trim()
      ? `Location and community, what the site says about itself: "${listing.orgDescription.trim()}".`
      : null,
  ]

  return lines.filter(Boolean).join(" ")
}
