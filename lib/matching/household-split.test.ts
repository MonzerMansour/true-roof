import { describe, expect, it } from "vitest"

import type { Listing } from "@/lib/listings/types"
import { listingFitsNeeds } from "@/lib/matching/hard-filters"
import { suggestHouseholdSplit } from "@/lib/matching/household-split"
import type { SeekerNeeds } from "@/lib/matching/needs"

function shelter(over: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    name: "Test Shelter",
    kind: "shelter",
    freshness: "live",
    lastConfirmedAt: new Date().toISOString(),
    pets: "any",
    couples: "same_room",
    parkingStatus: null,
    vehicleNote: null,
    city: "San Jose",
    orgName: "Test Org",
    orgDescription: null,
    address: "1 Test St",
    lat: 37.3382,
    lng: -121.8863,
    phone: "+14085550100",
    intakeMethod: "register",
    idRequired: "not_required",
    curfewPolicy: "no_curfew",
    curfewTime: null,
    intakeFrom: "00:00",
    intakeTo: "23:59",
    maxStay: "no_limit",
    petWeightLimitLbs: null,
    vehicleAllowed: null,
    vehicleMaxLengthFt: null,
    registrationRequired: null,
    projectType: "emergency_shelter",
    totalBeds: 40,
    dataSource: "provider_portal",
    sourceUrl: null,
    sourceAsOf: "2026-09-26",
    externalRating: null,
    externalRatingCount: null,
    externalRatingSource: null,
    ...over,
  }
}

function needs(over: Partial<SeekerNeeds> = {}): SeekerNeeds {
  return {
    household: "with_partner",
    partnerRooms: "same_room",
    pet: "none",
    petWeightLbs: null,
    idStatus: "have_id",
    vehicle: "none",
    vehicleSize: null,
    vehicleRegistered: null,
    arrivalFrom: "00:00",
    arrivalTo: "23:59",
    latestEntry: null,
    daysNeeded: 1,
    placeNote: null,
    ...over,
  }
}

describe("suggestHouseholdSplit", () => {
  it("stays quiet when one site already takes the couple", () => {
    const listings = [
      shelter({ id: "a", couples: "same_room" }),
      shelter({
        id: "b",
        name: "Solo A",
        couples: "not_allowed",
        lat: 37.34,
        lng: -121.89,
      }),
    ]
    expect(suggestHouseholdSplit(listings, needs())).toBeNull()
  })

  it("pairs two solo-fit sites when no listing takes the household", () => {
    const yours = shelter({
      id: "solo-1",
      name: "North mats",
      couples: "not_allowed",
      lat: 37.34,
      lng: -121.89,
    })
    const partner = shelter({
      id: "solo-2",
      name: "South mats",
      couples: "not_allowed",
      lat: 37.33,
      lng: -121.88,
    })
    const split = suggestHouseholdSplit([yours, partner], needs())
    expect(split).not.toBeNull()
    expect([split!.yours.id, split!.partner.id].sort()).toEqual([
      "solo-1",
      "solo-2",
    ])
    expect(listingFitsNeeds(split!.yours, needs()).fits).toBe(false)
    expect(split!.yoursFit.fits).toBe(true)
    expect(split!.partnerFit.fits).toBe(true)
  })

  it("does not pair a site that fails a non-couple hard rule", () => {
    const ok = shelter({
      id: "ok",
      couples: "not_allowed",
    })
    const noPets = shelter({
      id: "no-pets",
      couples: "not_allowed",
      pets: "not_allowed",
    })
    expect(
      suggestHouseholdSplit(
        [ok, noPets],
        needs({ pet: "larger_pet" })
      )
    ).toBeNull()
  })

  it("does not run for a person looking alone", () => {
    expect(
      suggestHouseholdSplit(
        [shelter({ id: "a" }), shelter({ id: "b" })],
        needs({ household: "alone", partnerRooms: null })
      )
    ).toBeNull()
  })
})
