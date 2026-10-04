import { describe, expect, it } from "vitest"

import type { Listing } from "@/lib/listings/types"
import { listingFitsNeeds } from "@/lib/matching/hard-filters"
import type { SeekerNeeds } from "@/lib/matching/needs"

// listingFitsNeeds is the only thing that removes a listing from someone's
// options, so it is worth covering even though ranking lives elsewhere.

function shelter(over: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    name: "Test Shelter",
    kind: "shelter",
    freshness: "live",
    lastConfirmedAt: new Date().toISOString(),
    pets: "any",
    couples: "same_room",
    parkingStatus: null,
    vehicleNote: null,
    city: "San Jose",
    orgName: "Org",
    orgDescription: null,
    address: null,
    lat: null,
    lng: null,
    phone: null,
    intakeMethod: "call",
    idRequired: null,
    curfewPolicy: null,
    curfewTime: null,
    intakeFrom: null,
    intakeTo: null,
    maxStay: null,
    petWeightLimitLbs: null,
    vehicleAllowed: null,
    vehicleMaxLengthFt: null,
    registrationRequired: null,
    projectType: null,
    totalBeds: null,
    dataSource: null,
    sourceUrl: null,
    sourceAsOf: null,
    ...over,
  }
}

const lot = (over: Partial<Listing> = {}) =>
  shelter({
    kind: "parking",
    pets: null,
    couples: null,
    parkingStatus: "open",
    ...over,
  })

function needs(over: Partial<SeekerNeeds> = {}): SeekerNeeds {
  return {
    household: "alone",
    partnerRooms: null,
    pet: "none",
    petWeightLbs: null,
    idStatus: "have_id",
    vehicle: "none",
    vehicleSize: null,
    vehicleRegistered: null,
    arrivalFrom: "17:00",
    arrivalTo: "21:00",
    latestEntry: null,
    daysNeeded: 1,
    placeNote: "",
    ...over,
  } as SeekerNeeds
}

describe("listingFitsNeeds", () => {
  it("keeps everything when no answers are saved", () => {
    const fit = listingFitsNeeds(shelter({ pets: "not_allowed" }), null)
    expect(fit.fits).toBe(true)
    expect(fit.reasons).toHaveLength(0)
  })

  it("excludes a larger pet from any site that is not any-pet", () => {
    for (const pets of ["not_allowed", "service_only", "small_pets"] as const) {
      const fit = listingFitsNeeds(
        shelter({ pets }),
        needs({ pet: "larger_pet" })
      )
      expect(fit.fits, pets).toBe(false)
    }
    expect(
      listingFitsNeeds(shelter({ pets: "any" }), needs({ pet: "larger_pet" }))
        .fits
    ).toBe(true)
  })

  it("excludes a small pet from no-pets and service-only sites", () => {
    expect(
      listingFitsNeeds(
        shelter({ pets: "not_allowed" }),
        needs({ pet: "small_pet" })
      ).fits
    ).toBe(false)
    expect(
      listingFitsNeeds(
        shelter({ pets: "service_only" }),
        needs({ pet: "small_pet" })
      ).fits
    ).toBe(false)
    expect(
      listingFitsNeeds(
        shelter({ pets: "small_pets" }),
        needs({ pet: "small_pet" })
      ).fits
    ).toBe(true)
  })

  it("does NOT exclude on an unpublished policy", () => {
    // Load bearing after the CA-500 import: 91 of 92 rows publish no policy,
    // so excluding on null would empty the feed for anyone with a pet.
    const fit = listingFitsNeeds(
      shelter({ pets: null }),
      needs({ pet: "larger_pet" })
    )
    expect(fit.fits).toBe(true)
  })

  it("excludes someone with no vehicle from a parking lot, and a full lot from everyone", () => {
    expect(listingFitsNeeds(lot(), needs({ vehicle: "none" })).fits).toBe(false)
    expect(
      listingFitsNeeds(
        lot({ parkingStatus: "full" }),
        needs({ vehicle: "car" })
      ).fits
    ).toBe(false)
    expect(listingFitsNeeds(lot(), needs({ vehicle: "car" })).fits).toBe(true)
  })

  it("handles couples room mismatches", () => {
    const couple = (partnerRooms: SeekerNeeds["partnerRooms"]) =>
      needs({ household: "with_partner", partnerRooms })

    expect(
      listingFitsNeeds(shelter({ couples: "not_allowed" }), couple("same_room"))
        .fits
    ).toBe(false)
    expect(
      listingFitsNeeds(
        shelter({ couples: "separate_rooms" }),
        couple("same_room")
      ).fits
    ).toBe(false)
    expect(
      listingFitsNeeds(shelter({ couples: "same_room" }), couple("same_room"))
        .fits
    ).toBe(true)
    expect(
      listingFitsNeeds(shelter({ couples: "separate_rooms" }), couple("either"))
        .fits
    ).toBe(true)
  })

  it("gives a reason for every exclusion", () => {
    // The UI renders reasons[0]; an exclusion with no reason would show a
    // listing marked as not fitting with nothing explaining why.
    const fit = listingFitsNeeds(
      shelter({ pets: "not_allowed" }),
      needs({ pet: "larger_pet" })
    )
    expect(fit.fits).toBe(false)
    expect(fit.reasons.length).toBeGreaterThan(0)
    expect(fit.reasons.every((r) => r.trim().length > 0)).toBe(true)
  })

  it("currently excludes a service animal from a no-pets site", () => {
    // Documents present behaviour, which is legally questionable: under the
    // ADA a service animal is not a pet and generally has to be allowed, so
    // this hides a bed the person has a right to. Flagged, not changed.
    const fit = listingFitsNeeds(
      shelter({ pets: "not_allowed" }),
      needs({ pet: "service_animal" })
    )
    expect(fit.fits).toBe(false)
  })
})
