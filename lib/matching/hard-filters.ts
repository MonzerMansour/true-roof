import { here4You, type PolicyField } from "@/lib/listings/sources"
import {
  formatIntakeWindow,
  formatTime,
  maxStayLabel,
  type Listing,
} from "@/lib/listings/types"
import type { SeekerNeeds } from "@/lib/matching/needs"
import { missesCurfew, windowsOverlap } from "@/lib/matching/time"
import {
  couplesFit,
  fallsShortOfStay,
  idFit,
  isServiceAnimalException,
  petsFit,
  registrationFit,
  vehicleFit,
  worst,
  type Compat,
} from "@/lib/matching/vocabulary"

// The only place a hard constraint is evaluated. This removes listings. It does
// not score: ordering lives in lib/matching/score.ts, and embedding order in
// lib/matching/rank.ts. Do not add a fourth matcher.

export type FitVerdict = "fits" | "unknown" | "excluded"

export type FitResult = {
  verdict: FitVerdict
  /** verdict !== "excluded". Kept so older call sites keep working. */
  fits: boolean
  /** Why this site was removed. Plain sentences, shown to the person. */
  reasons: string[]
  /** Constraints this site has not published. These NEVER remove a listing. */
  unknowns: PolicyField[]
  /** Worth knowing, but not a reason to hide the site. */
  notes: string[]
}

/** Null on the listing side means "not published", never "no".
 *
 * This matters far more than it looks. Most rows come from HUD's county bed
 * count, which publishes none of these rules, so a restrictive reading would
 * empty the feed for anyone with a dog and a permissive-but-silent reading
 * would send them on a wasted trip across the county. So an unpublished rule
 * keeps the site in the list AND is named on the card, with the number to call.
 */
function check(
  needed: boolean,
  published: unknown,
  field: PolicyField,
  evaluate: () => Compat,
  onExcluded: () => string,
  onCheck?: () => string
): { compat: Compat; reason?: string; unknown?: PolicyField; note?: string } {
  if (!needed) return { compat: "fits" }
  if (published == null) return { compat: "fits", unknown: field }

  const compat = evaluate()
  if (compat === "excluded") return { compat, reason: onExcluded() }
  if (compat === "check") return { compat, note: onCheck?.() ?? onExcluded() }
  return { compat }
}

export function listingFitsNeeds(
  listing: Listing,
  needs: SeekerNeeds | null
): FitResult {
  if (!needs) {
    return { verdict: "fits", fits: true, reasons: [], unknowns: [], notes: [] }
  }

  const reasons: string[] = []
  const unknowns: PolicyField[] = []
  const notes: string[] = []
  const results: Compat[] = []

  const apply = (outcome: ReturnType<typeof check>) => {
    results.push(outcome.compat)
    if (outcome.reason) reasons.push(outcome.reason)
    if (outcome.unknown) unknowns.push(outcome.unknown)
    if (outcome.note) notes.push(outcome.note)
  }

  // Pets. A service animal is not a pet and is handled in petsFit, which never
  // excludes it. See lib/matching/vocabulary.ts.
  apply(
    check(
      needs.pet !== "none",
      listing.pets,
      "pets",
      () => petsFit[needs.pet][listing.pets!],
      () =>
        needs.pet === "larger_pet"
          ? "This site does not take a larger pet."
          : "This site does not take pets.",
      () =>
        isServiceAnimalException(needs.pet, listing.pets)
          ? `This site's listed policy is no pets, but a service animal is not a pet and generally has to be allowed. Call ${here4You.display} or the site before you go.`
          : "Check with this site about your pet."
    )
  )

  // Pet weight, only meaningful once both numbers are known.
  if (
    needs.pet === "small_pet" &&
    needs.petWeightLbs != null &&
    listing.pets === "small_pets"
  ) {
    if (listing.petWeightLimitLbs == null) {
      unknowns.push("petWeightLimitLbs")
      results.push("fits")
    } else if (needs.petWeightLbs > listing.petWeightLimitLbs) {
      reasons.push(
        `This site's pet limit is ${listing.petWeightLimitLbs} lb and you said about ${needs.petWeightLbs} lb.`
      )
      results.push("excluded")
    } else {
      results.push("fits")
    }
  }

  // Couples. partnerRooms cannot be null when household is with_partner in the
  // form, but a stored blob can be, so treat that as "either works".
  apply(
    check(
      needs.household === "with_partner",
      listing.couples,
      "couples",
      () => couplesFit[needs.partnerRooms ?? "either"][listing.couples!],
      () => {
        if (listing.couples === "not_allowed") {
          return "This site does not take couples."
        }
        return listing.couples === "separate_rooms"
          ? "This site only has separate rooms for partners."
          : "This site only has a shared room for partners."
      }
    )
  )

  // ID.
  apply(
    check(
      needs.idStatus !== "have_id",
      listing.idRequired,
      "idRequired",
      () => idFit[needs.idStatus][listing.idRequired!],
      () => "This site requires a photo ID.",
      () => "This site asks for ID but decides case by case. Worth a call."
    )
  )

  // Safe parking is for people sleeping in a vehicle.
  if (needs.vehicle === "none" && listing.kind === "parking") {
    reasons.push("Safe parking is for people sleeping in a car or RV.")
    results.push("excluded")
  }

  if (listing.kind === "parking" && needs.vehicle !== "none") {
    apply(
      check(
        true,
        listing.vehicleAllowed,
        "vehicleAllowed",
        () => vehicleFit[needs.vehicle][listing.vehicleAllowed!],
        () => "This lot does not take an RV or van.",
        () =>
          "This lot takes vans but not RVs. Call to check which yours counts as."
      )
    )

    // A long vehicle against a cars-only lot is already excluded above. A
    // published length limit is a fact the person should see, not a rule we can
    // apply, because the questionnaire asks for a size category, not feet.
    if (needs.vehicleSize === "large" && listing.vehicleMaxLengthFt != null) {
      notes.push(
        `This lot's longest vehicle is ${listing.vehicleMaxLengthFt} ft. Check yours fits.`
      )
      results.push("check")
    }

    apply(
      check(
        needs.vehicleRegistered != null && needs.vehicleRegistered !== "yes",
        listing.registrationRequired,
        "registrationRequired",
        () =>
          registrationFit[needs.vehicleRegistered!][
            listing.registrationRequired!
          ],
        () => "This lot requires registration and plates.",
        () => "This lot asks about registration. Call to check."
      )
    )
  }

  // Check-in window. An end earlier than a start wraps past midnight.
  if (listing.intakeFrom && listing.intakeTo) {
    const overlaps = windowsOverlap(
      needs.arrivalFrom,
      needs.arrivalTo,
      listing.intakeFrom,
      listing.intakeTo
    )
    if (overlaps === false) {
      reasons.push(
        `Check-in is ${formatIntakeWindow(listing.intakeFrom, listing.intakeTo)} and you said you can get there ${formatIntakeWindow(needs.arrivalFrom, needs.arrivalTo)}.`
      )
      results.push("excluded")
    } else {
      results.push("fits")
    }
  } else {
    unknowns.push("intakeWindow")
  }

  // Curfew. Only a published fixed time can exclude. "No curfew" cannot.
  if (needs.latestEntry) {
    if (listing.curfewPolicy == null) {
      unknowns.push("curfew")
    } else if (
      listing.curfewPolicy === "fixed_time" &&
      missesCurfew(needs.latestEntry, listing.curfewTime) === true
    ) {
      reasons.push(
        `Doors lock at ${formatTime(listing.curfewTime!)} and you said you need to get in by ${formatTime(needs.latestEntry)}.`
      )
      results.push("excluded")
    } else {
      results.push("fits")
    }
  }

  // Max stay NEVER excludes. Someone who needs 90 nights still needs tonight,
  // and hiding the one night mat would leave them outside.
  if (listing.maxStay == null) {
    unknowns.push("maxStay")
  } else if (fallsShortOfStay(needs.daysNeeded, listing.maxStay)) {
    notes.push(
      `${maxStayLabel[listing.maxStay]}, which is shorter than you asked for. Still somewhere to sleep tonight.`
    )
  }

  // A full lot is a fact about tonight, not a policy.
  if (listing.kind === "parking" && listing.parkingStatus === "full") {
    reasons.push("This lot is full.")
    results.push("excluded")
  }

  const verdict: FitVerdict =
    reasons.length > 0
      ? "excluded"
      : worst(results) === "check" || unknowns.length > 0
        ? "unknown"
        : "fits"

  return {
    verdict,
    fits: verdict !== "excluded",
    reasons,
    unknowns,
    notes,
  }
}
