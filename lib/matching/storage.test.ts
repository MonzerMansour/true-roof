import { beforeEach, describe, expect, it } from "vitest"

import { loadNeeds, saveNeeds } from "@/lib/matching/storage"
import type { SeekerNeeds } from "@/lib/matching/needs"

// storage.ts guards on `typeof window === "undefined"`, so a minimal stub is
// enough. No jsdom needed.
const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  ;(globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  }
})

const valid: SeekerNeeds = {
  household: "alone",
  partnerRooms: null,
  pet: "larger_pet",
  petWeightLbs: null,
  idStatus: "no_id",
  vehicle: "none",
  vehicleSize: null,
  vehicleRegistered: null,
  arrivalFrom: "17:00",
  arrivalTo: "21:00",
  latestEntry: "23:00",
  daysNeeded: 30,
}

describe("loadNeeds", () => {
  it("round-trips a valid answer set", () => {
    saveNeeds(valid)
    expect(loadNeeds()).toEqual(valid)
  })

  it("accepts a null latestEntry, meaning no late need", () => {
    saveNeeds({ ...valid, latestEntry: null })
    expect(loadNeeds()?.latestEntry).toBeNull()
  })

  it("accepts a small pet with a weight", () => {
    saveNeeds({ ...valid, pet: "small_pet", petWeightLbs: 12 })
    expect(loadNeeds()?.petWeightLbs).toBe(12)
  })

  it("accepts a couple", () => {
    saveNeeds({
      ...valid,
      household: "with_partner",
      partnerRooms: "same_room",
    })
    expect(loadNeeds()?.partnerRooms).toBe("same_room")
  })

  it("accepts a vehicle", () => {
    saveNeeds({
      ...valid,
      vehicle: "rv_van",
      vehicleSize: "large",
      vehicleRegistered: "not_sure",
    })
    expect(loadNeeds()?.vehicle).toBe("rv_van")
  })

  it("returns null for a value outside the enum", () => {
    // The reason this guard was tightened: "dog" used to pass, and an undefined
    // lookup in the bridge tables is neither a fit nor an exclusion.
    saveNeeds({ ...valid, pet: "dog" as SeekerNeeds["pet"] })
    expect(loadNeeds()).toBeNull()
  })

  it("returns null for a malformed time", () => {
    saveNeeds({ ...valid, arrivalFrom: "5pm" })
    expect(loadNeeds()).toBeNull()
  })

  it("returns null for a pet weight out of range", () => {
    saveNeeds({ ...valid, pet: "small_pet", petWeightLbs: 900 })
    expect(loadNeeds()).toBeNull()
  })

  it("returns null when nothing is stored", () => {
    expect(loadNeeds()).toBeNull()
  })
})
