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
