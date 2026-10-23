import { describe, expect, it } from "vitest"

import {
  ALMOST_FULL_AT,
  checkCapacity,
  fillLevel,
  spotsLeft,
  spotsLeftText,
} from "@/lib/listings/availability"

describe("spotsLeft", () => {
  it("is the maximum minus who is there now", () => {
    expect(spotsLeft({ totalBeds: 40, currentPeople: 31 })).toBe(9)
  })

  it("is null when either number is not published, never zero", () => {
    expect(spotsLeft({ totalBeds: 40, currentPeople: null })).toBeNull()
    expect(spotsLeft({ totalBeds: null, currentPeople: 3 })).toBeNull()
    expect(spotsLeft({})).toBeNull()
  })

  it("never goes below zero if the count has drifted past the maximum", () => {
    expect(spotsLeft({ totalBeds: 10, currentPeople: 13 })).toBe(0)
  })
})

describe("fillLevel", () => {
  const site = (left: number) => ({ totalBeds: 30, currentPeople: 30 - left })

  it("says almost full at exactly 5 spots left, the stated line", () => {
    expect(ALMOST_FULL_AT).toBe(5)
    expect(fillLevel(site(5))).toBe("almost_full")
    expect(fillLevel(site(1))).toBe("almost_full")
  })

  it("says nothing at 6 or more", () => {
    expect(fillLevel(site(6))).toBeNull()
    expect(fillLevel(site(30))).toBeNull()
  })

  it("says full, not almost full, at none left", () => {
    expect(fillLevel(site(0))).toBe("full")
  })

  it("says nothing for a site that has not published its numbers", () => {
    expect(fillLevel({ totalBeds: 30, currentPeople: null })).toBeNull()
    expect(fillLevel({})).toBeNull()
  })
})

describe("spotsLeftText", () => {
  it("handles one spot and many", () => {
    expect(spotsLeftText({ totalBeds: 10, currentPeople: 9 })).toBe("1 spot left")
    expect(spotsLeftText({ totalBeds: 10, currentPeople: 4 })).toBe("6 spots left")
    expect(spotsLeftText({ totalBeds: 10, currentPeople: 10 })).toBe("0 spots left")
  })

  it("is null when not published", () => {
    expect(spotsLeftText({ totalBeds: 10 })).toBeNull()
  })
})

describe("checkCapacity", () => {
  it("accepts a real pair", () => {
    expect(checkCapacity({ max: "40", current: "12" }, true)).toEqual({
      ok: true,
      max: 40,
      current: 12,
    })
  })

  it("accepts zero people there now, a site that is empty tonight", () => {
    expect(checkCapacity({ max: "40", current: "0" }, true)).toEqual({
      ok: true,
      max: 40,
      current: 0,
    })
  })

  it("requires both when a site is created or published", () => {
    const noMax = checkCapacity({ max: "", current: "3" }, true)
    expect(noMax.ok).toBe(false)
    const noNow = checkCapacity({ max: "40", current: "" }, true)
    expect(noNow).toEqual({
      ok: false,
      error: "Add how many people are there now.",
    })
  })

  it("lets an existing site stay blank when nothing is required", () => {
    expect(checkCapacity({ max: "", current: "" }, false)).toEqual({
      ok: true,
      max: null,
      current: null,
    })
  })

  it("rejects more people than the site can hold", () => {
    const result = checkCapacity({ max: "10", current: "11" }, false)
    expect(result.ok).toBe(false)
  })

  it("rejects a count with no maximum to measure it against", () => {
    expect(checkCapacity({ max: "", current: "4" }, false).ok).toBe(false)
  })

  it("rejects a maximum of zero, a decimal, text and a negative", () => {
    expect(checkCapacity({ max: "0", current: "" }, false).ok).toBe(false)
    expect(checkCapacity({ max: "2.5", current: "" }, false).ok).toBe(false)
    expect(checkCapacity({ max: "lots", current: "" }, false).ok).toBe(false)
    expect(checkCapacity({ max: "40", current: "-1" }, false).ok).toBe(false)
  })

  it("rejects numbers past the limit", () => {
    expect(checkCapacity({ max: "10001", current: "" }, false).ok).toBe(false)
  })
})
