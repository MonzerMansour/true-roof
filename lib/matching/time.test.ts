import { describe, expect, it } from "vitest"

import {
  isHHMM,
  minutesFromHHMM,
  missesCurfew,
  timeWithinWindow,
  windowsOverlap,
} from "@/lib/matching/time"

describe("minutesFromHHMM", () => {
  it("parses a real time", () => {
    expect(minutesFromHHMM("00:00")).toBe(0)
    expect(minutesFromHHMM("07:30")).toBe(450)
    expect(minutesFromHHMM("23:59")).toBe(1439)
  })

  it("rejects anything that is not a time", () => {
    for (const bad of [null, "", "24:00", "12:60", "noon", "7pm", "7:5"]) {
      expect(minutesFromHHMM(bad as string | null), String(bad)).toBeNull()
    }
  })

  it("backs isHHMM", () => {
    expect(isHHMM("19:00")).toBe(true)
    expect(isHHMM("tomorrow")).toBe(false)
    expect(isHHMM(undefined)).toBe(false)
  })
})

describe("windowsOverlap", () => {
  it("finds a plain overlap", () => {
    expect(windowsOverlap("17:00", "21:00", "18:00", "20:00")).toBe(true)
  })

  it("reports no overlap when the windows are disjoint", () => {
    expect(windowsOverlap("09:00", "12:00", "18:00", "20:00")).toBe(false)
  })

  it("counts a shared endpoint as an overlap", () => {
    // Intake "until 20:00" and arrival "from 20:00" do meet, at 20:00.
    expect(windowsOverlap("20:00", "23:00", "09:00", "20:00")).toBe(true)
  })

  it("handles a site window that wraps past midnight", () => {
    // The real Mountain View overnight lots: 7pm to 7am.
    const from = "19:00"
    const to = "07:00"
    expect(windowsOverlap("22:00", "23:00", from, to)).toBe(true)
    expect(windowsOverlap("02:00", "04:00", from, to)).toBe(true)
    expect(windowsOverlap("19:00", "19:30", from, to)).toBe(true)
    expect(windowsOverlap("06:30", "08:30", from, to)).toBe(true)
    expect(windowsOverlap("09:00", "17:00", from, to)).toBe(false)
  })

  it("handles both windows wrapping", () => {
    expect(windowsOverlap("23:00", "02:00", "22:00", "01:00")).toBe(true)
  })

  it("returns null when either side is unknown, rather than guessing", () => {
    expect(windowsOverlap(null, "21:00", "18:00", "20:00")).toBeNull()
    expect(windowsOverlap("17:00", "21:00", "18:00", null)).toBeNull()
  })
})

describe("timeWithinWindow", () => {
  it("works across midnight", () => {
    expect(timeWithinWindow("23:30", "19:00", "07:00")).toBe(true)
    expect(timeWithinWindow("03:00", "19:00", "07:00")).toBe(true)
    expect(timeWithinWindow("12:00", "19:00", "07:00")).toBe(false)
  })

  it("works in an ordinary window", () => {
    expect(timeWithinWindow("10:00", "09:00", "17:00")).toBe(true)
    expect(timeWithinWindow("18:00", "09:00", "17:00")).toBe(false)
  })
})

describe("missesCurfew", () => {
  it("misses when they need in later than the doors lock", () => {
    expect(missesCurfew("23:00", "21:00")).toBe(true)
  })

  it("does not miss when they can be in earlier", () => {
    expect(missesCurfew("20:00", "22:00")).toBe(false)
  })

  it("does not miss at exactly the curfew", () => {
    expect(missesCurfew("22:00", "22:00")).toBe(false)
  })

  it("treats midnight as the end of the night", () => {
    // The questionnaire's "Midnight or later" is stored as 00:00. Read as a
    // plain clock value it is the earliest time of day and would beat every
    // curfew, which is backwards.
    expect(missesCurfew("00:00", "22:00")).toBe(true)
    expect(missesCurfew("00:00", "23:00")).toBe(true)
  })

  it("returns null when either side is unknown", () => {
    expect(missesCurfew(null, "22:00")).toBeNull()
    expect(missesCurfew("23:00", null)).toBeNull()
  })
})
