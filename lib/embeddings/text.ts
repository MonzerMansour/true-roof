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
import {
  couplesLabel,
  intakeLabel,
  maxStayOption,
  petsLabel,
  registrationRequiredOption,
  vehicleAllowedOption,
  type IdRequired,
  type Listing,
} from "@/lib/listings/types"

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

// Worded like the seeker's answers in needsToText() ("Photo ID: No, I do not
// have ID." meets "Photo ID: not needed here."), so matching facts land near
// each other in the embedding.
const siteIdText: Record<IdRequired, string> = {
  required: "required to get in",
  not_required: "not needed here",
  case_by_case: "case by case, they can work with someone who has no ID",
}

export function listingToText(listing: Listing) {
  const lines = [
    `${listing.kind === "shelter" ? "Shelter" : "Safe parking"}: ${listing.name}, run by ${listing.orgName}, in ${listing.city}.`,
    listing.pets ? `${petsLabel[listing.pets]}.` : null,
    listing.couples ? `${couplesLabel[listing.couples]}.` : null,
    listing.petWeightLimitLbs
      ? `Pets up to about ${listing.petWeightLimitLbs} pounds.`
      : null,
    listing.idRequired ? `Photo ID: ${siteIdText[listing.idRequired]}.` : null,
    // Everything staff fill in under Additional info in the portal, so a site
    // that publishes its rules is ranked on them, not only on its name.
    listing.intakeFrom && listing.intakeTo
      ? `Check in between ${formatTime(listing.intakeFrom)} and ${formatTime(listing.intakeTo)}.`
      : null,
    listing.curfewPolicy === "no_curfew"
      ? "Late entry: no curfew, you can come in late."
      : listing.curfewPolicy === "fixed_time" && listing.curfewTime
        ? `Late entry: doors lock at ${formatTime(listing.curfewTime)}.`
        : null,
    listing.maxStay ? `Longest stay: ${maxStayOption[listing.maxStay]}.` : null,
    listing.totalBeds ? `Beds: ${listing.totalBeds}.` : null,
    listing.intakeMethod ? `How to get in: ${intakeLabel[listing.intakeMethod]}.` : null,
    listing.parkingStatus ? `Parking status: ${listing.parkingStatus}.` : null,
    listing.vehicleAllowed
      ? `Vehicles allowed: ${vehicleAllowedOption[listing.vehicleAllowed]}.`
      : null,
    listing.vehicleMaxLengthFt
      ? `Vehicles up to ${listing.vehicleMaxLengthFt} feet long.`
      : null,
    listing.registrationRequired
      ? `Vehicle registration: ${registrationRequiredOption[listing.registrationRequired].toLowerCase()}.`
      : null,
    listing.vehicleNote ? `Vehicles: ${listing.vehicleNote}.` : null,
    listing.address?.trim() ? `Address: ${listing.address.trim()}.` : null,
    // Same "location and community" framing as needsToText(), so a
    // seeker's "near a park" and a site's "next to a public park" land in
    // the same part of the sentence rather than two differently shaped
    // trailing quotes.
    listing.description?.trim()
      ? `Location and community, what the site says about itself: "${listing.description.trim()}".`
      : null,
    listing.orgDescription?.trim()
      ? `Location and community, what the organization says about itself: "${listing.orgDescription.trim()}".`
      : null,
  ]

  return lines.filter(Boolean).join(" ")
}
