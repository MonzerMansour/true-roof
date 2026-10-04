import { describe, expect, it } from "vitest"

import { buildSchedule } from "@/lib/obligations/schedule"
import {
  emptyProfile,
  type Deadline,
  type ObligationsProfile,
} from "@/lib/obligations/types"

function profileWith(patch: Partial<ObligationsProfile>): ObligationsProfile {
  return { ...emptyProfile, ...patch }
}

function deadline(patch: Partial<Deadline>): Deadline {
  return {
    id: "d1",
    title: "Pay phone bill",
    category: "bill",
    program: null,
    firstDueDate: "2026-01-20",
    repeat: { every: 1, unit: "month" },
    whatToBring: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  }
}

const dates = (items: { date: string }[]) => items.map((o) => o.date)

describe("buildSchedule: only this calendar year", () => {
  it("shows a monthly deadline for the rest of this year and no further", () => {
    const { upcoming } = buildSchedule(
      profileWith({ deadlines: [deadline({ firstDueDate: "2026-01-20" })] }),
      [],
      new Date(2026, 0, 5) // Jan 5, 2026
    )
    expect(upcoming).toHaveLength(12)
    expect(upcoming[0].date).toBe("2026-01-20")
    expect(upcoming.at(-1)?.date).toBe("2026-12-20")
  })

  it("shows only this year's date for every 6 months", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [deadline({ firstDueDate: "2026-10-15", repeat: { every: 6, unit: "month" } })],
      }),
      [],
      new Date(2026, 9, 3) // Oct 3, 2026
    )
    expect(dates(upcoming)).toEqual(["2026-10-15"])
  })

  it("still shows the next date when none falls this year", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        programs: [{ kind: "housing_voucher", label: "Housing voucher", nextRecertDate: "2027-03-01" }],
      }),
      [],
      new Date(2026, 9, 3)
    )
    expect(dates(upcoming)).toEqual(["2027-03-01"])
  })
})

describe("buildSchedule: marking done", () => {
  it("hides January and adds next January at the bottom", () => {
    const { upcoming, done } = buildSchedule(
      profileWith({ deadlines: [deadline({ firstDueDate: "2026-01-20" })] }),
      ["deadline-d1-2026-01-20"],
      new Date(2026, 0, 5)
    )
    expect(upcoming).toHaveLength(12)
    expect(upcoming[0].date).toBe("2026-02-20")
    expect(upcoming.at(-1)?.date).toBe("2027-01-20")
    expect(dates(done)).toEqual(["2026-01-20"])
  })

  it("moves an every-6-months deadline to next year once this year's is done", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [deadline({ firstDueDate: "2026-10-15", repeat: { every: 6, unit: "month" } })],
      }),
      ["deadline-d1-2026-10-15"],
      new Date(2026, 9, 3)
    )
    expect(dates(upcoming)).toEqual(["2027-04-15"])
  })

  it("lists recently done items newest first", () => {
    const { done } = buildSchedule(
      profileWith({ deadlines: [deadline({ firstDueDate: "2026-01-20" })] }),
      ["deadline-d1-2026-01-20", "deadline-d1-2026-02-20"],
      new Date(2026, 0, 5)
    )
    expect(dates(done)).toEqual(["2026-02-20", "2026-01-20"])
  })
})

describe("buildSchedule: programs and old data", () => {
  it("writes the next CalFresh report from the first one", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        programs: [{ kind: "calfresh", label: "CalFresh", nextRecertDate: "2026-10-15" }],
      }),
      ["recert-calfresh-2026-10-15"],
      new Date(2026, 9, 3)
    )
    expect(dates(upcoming)).toEqual(["2027-04-15"])
  })

  it("keeps a recently missed deadline so it counts as overdue", () => {
    const { upcoming } = buildSchedule(
      profileWith({ deadlines: [deadline({ firstDueDate: "2026-09-20", createdAt: "2026-09-01T00:00:00.000Z" })] }),
      [],
      new Date(2026, 9, 3)
    )
    expect(upcoming[0].date).toBe("2026-09-20")
  })

  it("never shows a due date from before the deadline was added", () => {
    const { upcoming } = buildSchedule(
      profileWith({ deadlines: [deadline({ firstDueDate: "2026-09-20", createdAt: "2026-10-02T00:00:00.000Z" })] }),
      [],
      new Date(2026, 9, 3)
    )
    expect(upcoming[0].date).toBe("2026-10-20")
  })

  it("tags typed deadlines so the whole series can be removed", () => {
    const { upcoming } = buildSchedule(
      profileWith({ deadlines: [deadline({})] }),
      [],
      new Date(2026, 0, 5)
    )
    expect(upcoming.every((o) => o.deadlineId === "d1")).toBe(true)
  })

  it("keeps an every-2-months bill on the same months whenever you look", () => {
    const profile = profileWith({
      utilities: [{ id: "u1", name: "Water", dueDay: 10, amount: null, frequency: "every_2_months" }],
    })
    const inOct = buildSchedule(profile, [], new Date(2026, 9, 3))
    const inNov = buildSchedule(profile, [], new Date(2026, 10, 3))
    expect(inOct.upcoming[0].date).toBe("2026-11-10")
    expect(inNov.upcoming[0].date).toBe("2026-11-10")
  })

  it("works on profiles saved before deadlines existed", () => {
    const old = profileWith({})
    delete old.deadlines
    expect(() => buildSchedule(old, [], new Date(2026, 9, 3))).not.toThrow()
  })
})

describe("buildSchedule: deleting one date", () => {
  it("drops just that date and pulls in the next one", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [deadline({ firstDueDate: "2026-10-15", repeat: { every: 6, unit: "month" }, skippedDates: ["2026-10-15"] })],
      }),
      [],
      new Date(2026, 9, 3)
    )
    expect(dates(upcoming)).toEqual(["2027-04-15"])
  })

  it("marks repeating deadline items so delete all can be offered", () => {
    const { upcoming } = buildSchedule(
      profileWith({ deadlines: [deadline({ repeat: null, firstDueDate: "2026-10-20" })] }),
      [],
      new Date(2026, 9, 3)
    )
    expect(upcoming[0].repeats).toBe(false)
  })
})
