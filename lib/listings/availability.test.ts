import { describe, expect, it } from "vitest"

import {
  ALWAYS_FULL_STATUS,
  checkMaxPeople,
  isAlwaysFull,
} from "@/lib/listings/availability"

describe("isAlwaysFull", () => {
  it("is true for a shelter staff marked always full", () => {
    expect(isAlwaysFull({ kind: "shelter", parkingStatus: "full" })).toBe(true)
  })

  it("is false for a shelter with no status, open, or a waitlist", () => {
    expect(isAlwaysFull({ kind: "shelter", parkingStatus: null })).toBe(false)
    expect(isAlwaysFull({ kind: "shelter" })).toBe(false)
    expect(isAlwaysFull({ kind: "shelter", parkingStatus: "open" })).toBe(false)
    expect(isAlwaysFull({ kind: "shelter", parkingStatus: "waitlist" })).toBe(false)
  })

  // A full lot already says so through its own Availability badge, so showing a
  // second "Almost Full" next to it would say the same thing twice.
  it("is false for a lot, which has its own status badge", () => {
    expect(isAlwaysFull({ kind: "parking", parkingStatus: "full" })).toBe(false)
  })

  it("writes the value the database already allows for parking_status", () => {
    expect(["open", "full", "waitlist"]).toContain(ALWAYS_FULL_STATUS)
  })
})

describe("checkMaxPeople", () => {
  it("accepts a real number", () => {
    expect(checkMaxPeople("40", true)).toEqual({ ok: true, max: 40 })
    expect(checkMaxPeople(" 40 ", false)).toEqual({ ok: true, max: 40 })
  })

  it("requires it when a site is created or published", () => {
    expect(checkMaxPeople("", true)).toEqual({
      ok: false,
      error: "Add the most people the site can hold.",
    })
  })

  it("lets an existing site stay blank when nothing is required", () => {
    expect(checkMaxPeople("", false)).toEqual({ ok: true, max: null })
  })

  it("rejects zero, a decimal, text and a negative", () => {
    expect(checkMaxPeople("0", false).ok).toBe(false)
    expect(checkMaxPeople("2.5", false).ok).toBe(false)
    expect(checkMaxPeople("lots", false).ok).toBe(false)
    expect(checkMaxPeople("-4", false).ok).toBe(false)
  })

  it("rejects a number past the limit", () => {
    expect(checkMaxPeople("10001", false).ok).toBe(false)
    expect(checkMaxPeople("10000", false).ok).toBe(true)
  })
})
