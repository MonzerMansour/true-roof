import { describe, expect, it } from "vitest"

import { cityCenters, defaultOrigin } from "@/lib/listings/geo"
import {
  changedFilterKeys,
  defaultPlaceFilters,
  isDefaultFilters,
  type PlaceFilters,
} from "@/lib/listings/place-filters"

const from = (over: Partial<PlaceFilters>): PlaceFilters => ({
  ...defaultPlaceFilters,
  ...over,
})

describe("isDefaultFilters", () => {
  it("is true for an untouched page", () => {
    // The bug this guards: hideFull ships as true, and counting it as an
    // applied filter made a fresh page show a chip and a badge reading 1, then
    // made Clear all look like it did nothing when the same default returned.
    expect(isDefaultFilters(defaultPlaceFilters)).toBe(true)
    expect(changedFilterKeys(defaultPlaceFilters)).toEqual([])
  })

  it("is true again after clearing back to the defaults", () => {
    const touched = from({ kind: "shelter", miles: 5, hideFull: false })
    expect(isDefaultFilters(touched)).toBe(false)
    expect(isDefaultFilters({ ...defaultPlaceFilters })).toBe(true)
  })
})

describe("changedFilterKeys", () => {
  it("reports hideFull only when it is turned OFF", () => {
    // On is the default, so it is not something the person applied.
    expect(changedFilterKeys(from({ hideFull: true }))).toEqual([])
    expect(changedFilterKeys(from({ hideFull: false }))).toEqual(["hideFull"])
  })

  it("notices each field on its own", () => {
    const cases: [Partial<PlaceFilters>, keyof PlaceFilters][] = [
      [{ kind: "shelter" }, "kind"],
      [{ kind: "parking" }, "kind"],
      [{ miles: 2 }, "miles"],
      [{ intake: "call" }, "intake"],
      [{ freshness: "live" }, "freshness"],
      [{ hideFull: false }, "hideFull"],
      [{ fit: "all" }, "fit"],
      [{ fit: "confirmed" }, "fit"],
    ]

    for (const [patch, key] of cases) {
      expect(changedFilterKeys(from(patch)), JSON.stringify(patch)).toEqual([
        key,
      ])
    }
  })

  it("counts several at once", () => {
    const keys = changedFilterKeys(from({ kind: "shelter", miles: 10 }))
    expect(keys).toHaveLength(2)
    expect(keys).toEqual(expect.arrayContaining(["kind", "miles"]))
  })

  it("treats a different origin as a change, by label not coordinates", () => {
    expect(changedFilterKeys(from({ origin: defaultOrigin }))).toEqual([])

    // Same coordinates as the default, different choice. Someone who tapped
    // Near me and landed downtown still chose Near me.
    const nearMe = { ...cityCenters["San Jose"], label: "Near me" }
    expect(changedFilterKeys(from({ origin: nearMe }))).toEqual(["origin"])

    const gilroy = { ...cityCenters["Gilroy"], label: "Gilroy" }
    expect(changedFilterKeys(from({ origin: gilroy }))).toEqual(["origin"])
  })

  it("survives a null origin without reporting a change", () => {
    expect(changedFilterKeys(from({ origin: null }))).toEqual([])
  })
})
