// The bridge between the two vocabularies.
//
// lib/matching/needs.ts describes what a person HAS. lib/listings/types.ts
// describes what a site ALLOWS. Those are genuinely different facts, so they
// are not merged into one enum. This file is the only place they meet, and it
// holds tables rather than logic: every pairing is written out and typed, so a
// reviewer can read a whole rule in six lines and TypeScript catches a missing
// combination.
//
// This is vocabulary, not the matcher. Rules are evaluated in
// lib/matching/hard-filters.ts. Order is decided in lib/matching/score.ts.
// Do not add a predicate or a score here.

import type {
  CouplesPolicy,
  IdRequired,
  MaxStay,
  PetsPolicy,
  RegistrationRequired,
  VehicleAllowed,
} from "@/lib/listings/types"
import type {
  IdStatus,
  PartnerRooms,
  PetNeed,
  VehicleNeed,
  VehicleRegistered,
} from "@/lib/matching/needs"

/** How a stated need lines up with a published policy.
 *
 * "check" is the important one. It means the two sides each said something, but
 * not enough to decide. That is different from a site publishing nothing, which
 * the matcher handles separately, and different from a real mismatch. A "check"
 * is shown to the person with the reason, never silently dropped. */
export type Compat = "fits" | "check" | "excluded"

// Pets.
//
// A service animal is NOT a pet. Under the ADA a service animal generally has
// to be allowed, so a site whose published policy is "no pets" is still one the
// person has a right to enter. Excluding it would hide a bed they are entitled
// to, so service_animal never excludes. It reports "check" against a no pets or
// service only policy so the UI can say so plainly and give them the phone
// number, rather than sending them to an argument at the door unprepared.
export const petsFit: Record<PetNeed, Record<PetsPolicy, Compat>> = {
  none: {
    not_allowed: "fits",
    service_only: "fits",
    small_pets: "fits",
    any: "fits",
  },
  service_animal: {
    not_allowed: "check",
    service_only: "fits",
    small_pets: "fits",
    any: "fits",
  },
  small_pet: {
    not_allowed: "excluded",
    service_only: "excluded",
    small_pets: "fits",
    any: "fits",
  },
  larger_pet: {
    not_allowed: "excluded",
    service_only: "excluded",
    small_pets: "excluded",
    any: "fits",
  },
}

/** True when the ADA is the reason this pairing is only a "check", so the UI
 * can explain why the site is still in the list. */
export function isServiceAnimalException(
  pet: PetNeed,
  policy: PetsPolicy | null
) {
  return (
    pet === "service_animal" &&
    (policy === "not_allowed" || policy === "service_only")
  )
}

// Couples. Rows are what the person needs, columns what the site offers.
// "either" is a wildcard on the seeker side; "not_allowed" is a capability on
// the site side, so this is a table, not a ladder.
export const couplesFit: Record<PartnerRooms, Record<CouplesPolicy, Compat>> = {
  same_room: {
    not_allowed: "excluded",
    same_room: "fits",
    separate_rooms: "excluded",
  },
  separate_rooms: {
    not_allowed: "excluded",
    same_room: "excluded",
    separate_rooms: "fits",
  },
  either: {
    not_allowed: "excluded",
    same_room: "fits",
    separate_rooms: "fits",
  },
}

// ID. "case_by_case" never excludes: it is exactly the answer that means the
// site will work with someone who has no ID.
export const idFit: Record<IdStatus, Record<IdRequired, Compat>> = {
  have_id: {
    required: "fits",
    not_required: "fits",
    case_by_case: "fits",
  },
  no_id: {
    required: "excluded",
    not_required: "fits",
    case_by_case: "check",
  },
  in_progress: {
    required: "excluded",
    not_required: "fits",
    case_by_case: "check",
  },
}

// Vehicles.
//
// The seeker option "An RV or van" covers both in one answer, so against a lot
// that takes vans but not RVs we genuinely cannot tell. That is a "check", not
// an exclusion: excluding would turn away a van, and including silently would
// send an RV to a lot that will refuse it.
export const vehicleFit: Record<VehicleNeed, Record<VehicleAllowed, Compat>> = {
  none: {
    car_only: "fits",
    car_van: "fits",
    car_van_rv: "fits",
  },
  car: {
    car_only: "fits",
    car_van: "fits",
    car_van_rv: "fits",
  },
  rv_van: {
    car_only: "excluded",
    car_van: "check",
    car_van_rv: "fits",
  },
}

export const registrationFit: Record<
  VehicleRegistered,
  Record<RegistrationRequired, Compat>
> = {
  yes: {
    required: "fits",
    not_required: "fits",
    case_by_case: "fits",
  },
  no: {
    required: "excluded",
    not_required: "fits",
    case_by_case: "check",
  },
  not_sure: {
    required: "check",
    not_required: "fits",
    case_by_case: "check",
  },
}

/** Nights each max stay tier allows. null means no published limit.
 *
 * Used for a note only. A max stay NEVER excludes a listing: someone who needs
 * 90 nights still has to sleep tonight, and hiding the one night mat because it
 * is not a three month answer would leave them outside. */
export const maxStayNights: Record<MaxStay, number | null> = {
  one_night: 1,
  up_to_7_nights: 7,
  up_to_14_nights: 14,
  up_to_30_nights: 30,
  up_to_90_nights: 90,
  up_to_180_nights: 180,
  no_limit: null,
}

/** Does this site's limit fall short of what the person said they need? */
export function fallsShortOfStay(needDays: number, maxStay: MaxStay | null) {
  if (maxStay == null) return false
  const allowed = maxStayNights[maxStay]
  return allowed != null && allowed < needDays
}

/** The worst of several outcomes. "excluded" beats "check" beats "fits". */
export function worst(results: Compat[]): Compat {
  if (results.includes("excluded")) return "excluded"
  if (results.includes("check")) return "check"
  return "fits"
}
