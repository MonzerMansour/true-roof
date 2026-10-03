import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { listingToText, needsToText } from "@/lib/embeddings/text"
import type { ListingTextInput } from "@/lib/embeddings/text"
import type { SeekerNeeds } from "@/lib/matching/needs"

const shelter: ListingTextInput = {
  kind: "shelter",
  name: "Gilroy Nightly Shelter",
  orgName: "HomeFirst",
  city: "Gilroy",
  pets: "small_pets",
  petWeightLimitLbs: 25,
  couples: "same_room",
  parkingStatus: null,
  vehicleNote: null,
  idRequired: "case_by_case",
  curfewPolicy: "fixed_time",
  curfewTime: "21:00",
  intakeFrom: "17:00",
  intakeTo: "20:00",
  maxStay: "up_to_30_nights",
  vehicleAllowed: null,
  registrationRequired: null,
}

const lot: ListingTextInput = {
  kind: "parking",
  name: "St. Timothy's Lot",
  orgName: "MOVE Mountain View",
  city: "Mountain View",
  pets: null,
  petWeightLimitLbs: null,
  couples: null,
  parkingStatus: "open",
  vehicleNote: "Passenger vehicles only. 4 spaces.",
  idRequired: null,
  curfewPolicy: null,
  curfewTime: null,
  intakeFrom: "19:00",
  intakeTo: "07:00",
  maxStay: null,
  vehicleAllowed: "car_only",
  registrationRequired: "not_required",
}

describe("listingToText", () => {
  it("describes a fully published shelter in plain sentences", () => {
    const text = listingToText(shelter)
    expect(text).toBe(
      "Shelter: Gilroy Nightly Shelter, run by HomeFirst, in Gilroy. " +
        "pets: small pets under a weight limit, up to 25 pounds. " +
        "couples: same room. " +
        "ID asked for, but they work with you. " +
        "Doors lock at 9:00 PM. " +
        "Check in 5:00 PM to 8:00 PM. " +
        "Up to 30 nights."
    )
  })

  it("says a wrapping window wraps", () => {
    expect(listingToText(lot)).toContain(
      "Check in 7:00 PM to 7:00 AM (past midnight)"
    )
  })

  it("omits every unpublished field rather than saying no", () => {
    // An imported row publishes almost nothing. The embedding text must not
    // assert "no pets" when the source simply never said.
    const bare: ListingTextInput = {
      ...shelter,
      pets: null,
      petWeightLimitLbs: null,
      couples: null,
      idRequired: null,
      curfewPolicy: null,
      curfewTime: null,
      intakeFrom: null,
      intakeTo: null,
      maxStay: null,
    }
    expect(listingToText(bare)).toBe(
      "Shelter: Gilroy Nightly Shelter, run by HomeFirst, in Gilroy."
    )
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
  // The script loads listingToText through tsx so the vectors match the app.
  // These checks keep the select columns and the import path from drifting.
  const script = readFileSync(
    resolve(process.cwd(), "scripts/embed-listings.mjs"),
    "utf8"
  )

  it("reads every column listingToText uses", () => {
    for (const column of [
      "pets",
      "pet_weight_limit_lbs",
      "couples",
      "id_required",
      "curfew_policy",
      "curfew_time",
      "intake_from",
      "intake_to",
      "max_stay",
      "parking_status",
      "vehicle_allowed",
      "registration_required",
      "vehicle_note",
    ]) {
      expect(script, `${column} missing from the select`).toContain(column)
    }
  })

  it("runs listingToText from lib/embeddings/text.ts via tsx", () => {
    expect(script).toContain("lib/embeddings/text.ts")
    expect(script).toContain("listingToText")
    expect(script).toContain("npx tsx")
  })
})
