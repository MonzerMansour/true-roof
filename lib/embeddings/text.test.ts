import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { listingToText, needsToText } from "@/lib/embeddings/text"
import type { Listing } from "@/lib/listings/types"
import type { SeekerNeeds } from "@/lib/matching/needs"

function shelter(over: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    name: "Gilroy Nightly Shelter",
    kind: "shelter",
    freshness: "live",
    lastConfirmedAt: new Date().toISOString(),
    pets: "small_pets",
    couples: "same_room",
    parkingStatus: null,
    vehicleNote: null,
    city: "Gilroy",
    orgName: "HomeFirst",
    orgDescription: null,
    address: "1 Test St",
    lat: 37.0,
    lng: -121.0,
    phone: null,
    intakeMethod: "register",
    idRequired: "case_by_case",
    curfewPolicy: "fixed_time",
    curfewTime: "21:00",
    intakeFrom: "17:00",
    intakeTo: "20:00",
    maxStay: "up_to_30_nights",
    petWeightLimitLbs: 25,
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
    costNote: null,
    screeningNote: null,
    requiresDocuments: null,
    facilitiesNote: null,
    securityNote: null,
    maxStayNote: null,
    waitlistNote: null,
    petsNote: null,
    ...over,
  }
}

describe("listingToText", () => {
  it("describes a shelter in plain sentences", () => {
    const text = listingToText(shelter())
    expect(text).toContain("Shelter: Gilroy Nightly Shelter, run by HomeFirst, in Gilroy.")
    expect(text).toContain("small pets")
    expect(text).toContain("same room")
  })

  it("includes a staff description when one is published", () => {
    expect(
      listingToText(shelter({ description: "Next to the bus line." }))
    ).toContain("Next to the bus line.")
  })
})

describe("listingToText: Additional info from the portal", () => {
  it("includes every rule staff can publish for a shelter", () => {
    const text = listingToText(shelter())
    expect(text).toContain("Pets up to about 25 pounds.")
    expect(text).toContain("Photo ID: case by case")
    expect(text).toContain("Check in between 5:00 PM and 8:00 PM.")
    expect(text).toContain("Late entry: doors lock at 9:00 PM.")
    expect(text).toContain("Longest stay: Up to 30 nights.")
    expect(text).toContain("Beds: 40.")
    expect(text).toContain("How to get in:")
    expect(text).toContain("Address: 1 Test St.")
  })

  it("says plainly when there is no curfew", () => {
    expect(listingToText(shelter({ curfewPolicy: "no_curfew", curfewTime: null }))).toContain(
      "Late entry: no curfew, you can come in late."
    )
  })

  it("includes vehicle rules for safe parking", () => {
    const text = listingToText(
      shelter({
        kind: "parking",
        pets: null,
        couples: null,
        vehicleAllowed: "car_van_rv",
        vehicleMaxLengthFt: 30,
        registrationRequired: "required",
      })
    )
    expect(text).toContain("Vehicles allowed: Cars, vans, and RVs.")
    expect(text).toContain("Vehicles up to 30 feet long.")
    expect(text).toContain("Vehicle registration: required.")
  })

  it("leaves out anything a site has not published", () => {
    const text = listingToText(
      shelter({
        idRequired: null,
        intakeFrom: null,
        intakeTo: null,
        curfewPolicy: null,
        curfewTime: null,
        maxStay: null,
        totalBeds: null,
        petWeightLimitLbs: null,
        address: null,
      })
    )
    for (const missing of ["Photo ID", "Check in", "Late entry", "Longest stay", "Beds", "Address"]) {
      expect(text).not.toContain(missing)
    }
  })
})

describe("needsToText", () => {
  it("describes a person's answers", () => {
    const needs: SeekerNeeds = {
      household: "with_partner",
      partnerRooms: "same_room",
      pet: "small_pet",
      petWeightLbs: 12,
      idStatus: "no_id",
      vehicle: "rv_van",
      vehicleSize: "large",
      vehicleRegistered: "not_sure",
      arrivalFrom: "17:00",
      arrivalTo: "21:00",
      latestEntry: "22:00",
      daysNeeded: 30,
      placeNote: null,
    }
    const text = needsToText(needs)
    expect(text).toContain("Household: Me and my partner.")
    expect(text).toContain("Pet: A small pet, about 12 pounds.")
    expect(text).toContain("Photo ID: No, I do not have ID.")
    expect(text).toContain("Can check in between 5:00 PM and 9:00 PM.")
  })

  it("includes every survey answer, and their own words about the area", () => {
    const text = needsToText({
      household: "with_partner",
      partnerRooms: "same_room",
      pet: "larger_pet",
      petWeightLbs: 60,
      idStatus: "have_id",
      vehicle: "car",
      vehicleSize: "standard",
      vehicleRegistered: "yes",
      arrivalFrom: "18:00",
      arrivalTo: "22:00",
      latestEntry: "22:00",
      daysNeeded: 30,
      placeNote: "Near the light rail",
    })
    for (const part of ["Household", "Partner rooms", "Pet", "Photo ID", "Vehicle:", "Vehicle size", "Vehicle registered", "Can check in", "Needs late entry", "Bed needed", "Near the light rail"]) {
      expect(text).toContain(part)
    }
  })
})

describe("scripts/embed-listings.mjs", () => {
  const script = readFileSync(
    resolve(process.cwd(), "scripts/embed-listings.mjs"),
    "utf8"
  )

  it("runs listingToText from lib/embeddings/text.ts via tsx", () => {
    expect(script).toContain("lib/embeddings/text.ts")
    expect(script).toContain("listingToText")
    expect(script).toContain("npx tsx")
  })
})
