import { describe, expect, it } from "vitest"

import {
  dueDatesBetween,
  nextDueDate,
  nthDueDate,
  parseLocalDate,
  repeatLabel,
} from "@/lib/obligations/recurrence"

const monthly = { every: 1, unit: "month" } as const
const sixMonths = { every: 6, unit: "month" } as const

describe("nthDueDate", () => {
  it("counts every 6 months from the first date", () => {
    expect(nthDueDate("2026-10-15", sixMonths, 1)).toBe("2027-04-15")
    expect(nthDueDate("2026-10-15", sixMonths, 2)).toBe("2027-10-15")
  })

  it("puts a 31st deadline on the last day of short months, then back on the 31st", () => {
    expect(nthDueDate("2027-01-31", monthly, 1)).toBe("2027-02-28")
    expect(nthDueDate("2027-01-31", monthly, 2)).toBe("2027-03-31")
    expect(nthDueDate("2027-01-31", monthly, 3)).toBe("2027-04-30")
  })

  it("handles leap years for a yearly deadline on Feb 29", () => {
    expect(nthDueDate("2028-02-29", { every: 1, unit: "year" }, 1)).toBe("2029-02-28")
    expect(nthDueDate("2028-02-29", { every: 1, unit: "year" }, 4)).toBe("2032-02-29")
  })

  it("crosses the year for weekly deadlines", () => {
    expect(nthDueDate("2026-12-28", { every: 2, unit: "week" }, 1)).toBe("2027-01-11")
  })

  it("has only one date for a one-time deadline", () => {
    expect(nthDueDate("2026-10-15", null, 0)).toBe("2026-10-15")
    expect(nthDueDate("2026-10-15", null, 1)).toBeNull()
  })
})

describe("dueDatesBetween", () => {
  it("lists a year of monthly rent", () => {
    const dates = dueDatesBetween("2026-11-01", monthly, "2026-10-03", "2027-10-03")
    expect(dates).toHaveLength(12)
    expect(dates[0]).toBe("2026-11-01")
    expect(dates.at(-1)).toBe("2027-10-01")
  })

  it("skips dates before the window but keeps the series going", () => {
    expect(dueDatesBetween("2026-01-15", sixMonths, "2026-10-01", "2027-10-01")).toEqual([
      "2027-01-15",
      "2027-07-15",
    ])
  })
})

describe("nextDueDate", () => {
  it("moves to the next cycle once this one is marked done", () => {
    const done = new Set(["2026-10-15"])
    expect(nextDueDate("2026-10-15", sixMonths, "2026-10-03")).toBe("2026-10-15")
    expect(nextDueDate("2026-10-15", sixMonths, "2026-10-03", (d) => done.has(d))).toBe(
      "2027-04-15"
    )
  })

  it("counts today as still due", () => {
    expect(nextDueDate("2026-10-03", null, "2026-10-03")).toBe("2026-10-03")
  })

  it("finds the next one when the first date was long ago", () => {
    expect(nextDueDate("2025-01-01", monthly, "2026-10-03")).toBe("2026-11-01")
  })

  it("returns nothing for a one-time deadline that has passed", () => {
    expect(nextDueDate("2026-09-01", null, "2026-10-03")).toBeNull()
  })
})

describe("parseLocalDate", () => {
  it("rejects dates that do not exist instead of rolling them over", () => {
    expect(parseLocalDate("2026-02-30")).toBeNull()
    expect(parseLocalDate("10/15/2026")).toBeNull()
  })
})

describe("repeatLabel", () => {
  it("reads naturally", () => {
    expect(repeatLabel(null)).toBe("One time")
    expect(repeatLabel(monthly)).toBe("Every month")
    expect(repeatLabel(sixMonths)).toBe("Every 6 months")
  })
})
