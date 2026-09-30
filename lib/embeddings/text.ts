// Plain sentences embed better than JSON. Keep both sides in the same
// vocabulary so a seeker and a site land near each other.
//
// scripts/embed-listings.mjs holds a hand-written copy of listingToText,
// because it is a plain .mjs with no build step and cannot resolve the "@/"
// alias this chain uses. That copy is guarded by a fixture test in
// lib/embeddings/text.test.ts: change the output here and the test fails,
// instead of the two quietly producing mismatched vectors.
//
// If you change listingToText, update scripts/embed-listings.mjs to match and
// re-run `npm run embeddings:listings`.
import {
  formatTime,
  householdLabel,
  idLabel,
  latestEntryLabel,
  partnerRoomsLabel,
  petLabel,
  stayLabel,
  vehicleLabel,
  vehicleRegisteredLabel,
  vehicleSizeLabel,
  type SeekerNeeds,
} from "@/lib/matching/needs"
import {
  couplesLabel,
  formatIntakeWindow,
  idRequiredLabel,
  maxStayLabel,
  petsLabel,
  registrationRequiredLabel,
  vehicleAllowedLabel,
  formatTime as formatSiteTime,
  type Listing,
} from "@/lib/listings/types"

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
    needs.vehicleSize
      ? `Vehicle size: ${vehicleSizeLabel[needs.vehicleSize]}.`
      : null,
    needs.vehicleRegistered
      ? `Vehicle registered: ${vehicleRegisteredLabel[needs.vehicleRegistered]}.`
      : null,
    `Can check in between ${formatTime(needs.arrivalFrom)} and ${formatTime(needs.arrivalTo)}.`,
    `Needs late entry: ${latestEntryLabel(needs.latestEntry)}.`,
    `Bed needed: ${stayLabel(needs.daysNeeded)}.`,
  ]

  return lines.filter(Boolean).join(" ")
}

/** Accepts a Listing or the snake_case row the embedding script reads. */
export type ListingTextInput = Pick<
  Listing,
  | "kind"
  | "name"
  | "orgName"
  | "city"
  | "pets"
  | "couples"
  | "parkingStatus"
  | "vehicleNote"
  | "idRequired"
  | "curfewPolicy"
  | "curfewTime"
  | "intakeFrom"
  | "intakeTo"
  | "maxStay"
  | "petWeightLimitLbs"
  | "vehicleAllowed"
  | "registrationRequired"
>

export function listingToText(listing: ListingTextInput) {
  const lines = [
    `${listing.kind === "shelter" ? "Shelter" : "Safe parking"}: ${listing.name}, run by ${listing.orgName}, in ${listing.city}.`,
    listing.pets
      ? `${petsLabel[listing.pets]}${
          listing.petWeightLimitLbs
            ? `, up to ${listing.petWeightLimitLbs} pounds`
            : ""
        }.`
      : null,
    listing.couples ? `${couplesLabel[listing.couples]}.` : null,
    listing.idRequired ? `${idRequiredLabel[listing.idRequired]}.` : null,
    listing.curfewPolicy === "no_curfew"
      ? "No curfew."
      : listing.curfewPolicy === "fixed_time" && listing.curfewTime
        ? `Doors lock at ${formatSiteTime(listing.curfewTime)}.`
        : null,
    listing.intakeFrom && listing.intakeTo
      ? `Check in ${formatIntakeWindow(listing.intakeFrom, listing.intakeTo)}.`
      : null,
    listing.maxStay ? `${maxStayLabel[listing.maxStay]}.` : null,
    listing.parkingStatus ? `Parking status: ${listing.parkingStatus}.` : null,
    listing.vehicleAllowed
      ? `${vehicleAllowedLabel[listing.vehicleAllowed]}.`
      : null,
    listing.registrationRequired
      ? `${registrationRequiredLabel[listing.registrationRequired]}.`
      : null,
    listing.vehicleNote ? `Lot notes: ${listing.vehicleNote}.` : null,
  ]

  return lines.filter(Boolean).join(" ")
}
