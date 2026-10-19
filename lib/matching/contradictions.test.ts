import { describe, expect, it } from "vitest"

import { findContradictions, readStances } from "@/lib/matching/contradictions"
import type { Listing } from "@/lib/listings/types"
import type { SeekerNeeds } from "@/lib/matching/needs"

const needs = (over: Partial<SeekerNeeds> = {}): SeekerNeeds => ({
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
  placeNote: null,
  ...over,
})

const site = (over: Partial<Listing> = {}) =>
  ({ kind: "shelter", pets: null, couples: null, description: null, orgDescription: null, vehicleNote: null, ...over }) as Listing

describe("readStances", () => {
  it("hears yes and no per clause", () => {
    const s = readStances("Pets welcome, no smoking.")
    expect([...s.yes]).toEqual(["pets"])
    expect([...s.no]).toEqual(["smoking"])
  })

  it("hears the many ways of saying no", () => {
    for (const text of ["No pets.", "Pets are not allowed.", "We don't take dogs", "pet-free building", "Animals prohibited"]) {
      expect(readStances(text).no.has("pets"), text).toBe(true)
    }
  })

  it("does not read a dog park as a dog", () => {
    expect(readStances("Near the dog park").yes.has("pets")).toBe(false)
  })
})

describe("findContradictions", () => {
  it("catches a site that says no pets in its own words when they have a dog", () => {
    const found = findContradictions(needs({ pet: "larger_pet" }), site({ description: "Quiet building. No pets." }))
    expect(found).toHaveLength(1)
    expect(found[0].detail).toBe("You need room for your pet, but this site says no pets.")
  })

  it("catches their own words against the site's rule", () => {
    const found = findContradictions(needs({ placeNote: "I have my dog with me" }), site({ pets: "not_allowed" }))
    expect(found.map((c) => c.topic)).toEqual(["pets"])
  })

  it("catches something they said no to that the site mentions", () => {
    const found = findContradictions(needs({ placeNote: "no curfew please" }), site({ description: "Curfew is 9 PM." }))
    expect(found[0].detail).toBe("You said no curfew, but this site mentions a curfew.")
  })

  it("does not read a site's no curfew as a refusal", () => {
    expect(findContradictions(needs({ placeNote: "I work late" }), site({ description: "No curfew." }))).toEqual([])
  })

  it("leaves two structured answers to the other scorer", () => {
    // Pet answer vs pet rule is already scored in categorical-score.ts.
    expect(findContradictions(needs({ pet: "small_pet" }), site({ pets: "not_allowed" }))).toEqual([])
  })

  it("finds nothing when they agree", () => {
    expect(findContradictions(needs({ placeNote: "my dog comes with me" }), site({ description: "Pets welcome." }))).toEqual([])
  })
})
