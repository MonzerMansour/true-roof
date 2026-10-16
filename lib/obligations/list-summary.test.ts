import { describe, expect, it } from "vitest"

import { summarizeForList } from "@/lib/obligations/list-summary"
import { assessRisk, buildSchedule } from "@/lib/obligations/schedule"
import {
  emptyProfile,
  type Deadline,
  type ObligationsProfile,
  type Occurrence,
} from "@/lib/obligations/types"

const short = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

const noSignals = {
  monthlyIncome: null,
  previousMonthlyIncome: null,
  incomeUpdatedAt: null,
  lastShutoffNoticeAt: null,
  lastCheckInAt: "2026-10-10",
}

function occurrence(patch: Partial<Occurrence>): Occurrence {
  return {
    id: "o1",
    date: "2026-10-20",
    title: "Thing",
    detail: "",
    kind: "deadline",
    amount: null,
    ...patch,
  }
}

function deadline(patch: Partial<Deadline>): Deadline {
  return {
    id: "d1",
    title: "Food bank pickup",
    category: "other",
    program: null,
    firstDueDate: "2026-09-14",
    repeat: { every: 1, unit: "week" },
    whatToBring: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...patch,
  }
}

function profileWith(patch: Partial<ObligationsProfile>): ObligationsProfile {
  return { ...emptyProfile, ...patch }
}

describe("buildSchedule: tags", () => {
  it("marks a repeating deadline recurring and a single one not", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [
          deadline({ id: "weekly" }),
          deadline({
            id: "once",
            title: "Dentist",
            repeat: null,
            firstDueDate: "2026-10-20",
          }),
        ],
      }),
      [],
      new Date(2026, 9, 12)
    )
    const weekly = upcoming.filter((o) => o.deadlineId === "weekly")
    const once = upcoming.filter((o) => o.deadlineId === "once")
    expect(
      weekly.every((o) => o.recurring && o.seriesId === "deadline-weekly")
    ).toBe(true)
    expect(once).toHaveLength(1)
    expect(once[0].recurring).toBe(false)
  })
})

describe("summarizeForList", () => {
  it("keeps one-off dates apart from repeating ones", () => {
    const summary = summarizeForList(
      [
        occurrence({ id: "a", seriesId: "lease", recurring: false }),
        occurrence({
          id: "b",
          seriesId: "rent",
          recurring: true,
          date: "2026-10-25",
        }),
      ],
      "2026-10-12"
    )
    expect(summary.oneTime.map((o) => o.id)).toEqual(["a"])
    expect(summary.recurring.map((g) => g.seriesId)).toEqual(["rent"])
  })

  it("collapses a repeating item into one row with its overdue count", () => {
    const items = [
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ].map((date) =>
      occurrence({
        id: `w-${date}`,
        date,
        seriesId: "deadline-w",
        recurring: true,
      })
    )
    const [group] = summarizeForList(items, "2026-10-12").recurring
    expect(group.next.date).toBe("2026-09-28")
    expect(group.overdue.map((o) => o.date)).toEqual([
      "2026-09-28",
      "2026-10-05",
    ])
    expect(group.upcomingCount).toBe(3)
  })

  it("puts the series that needs attention first", () => {
    const summary = summarizeForList(
      [
        occurrence({
          id: "r",
          date: "2026-11-01",
          seriesId: "rent",
          recurring: true,
          title: "Rent",
        }),
        occurrence({
          id: "w",
          date: "2026-10-01",
          seriesId: "w",
          recurring: true,
          title: "Weekly",
        }),
      ],
      "2026-10-12"
    )
    expect(summary.recurring.map((g) => g.seriesId)).toEqual(["w", "rent"])
  })

  it("lists one-time dates oldest first so overdue ones lead", () => {
    const summary = summarizeForList(
      [
        occurrence({ id: "later", date: "2026-11-01" }),
        occurrence({ id: "late", date: "2026-10-01" }),
      ],
      "2026-10-12"
    )
    expect(summary.oneTime.map((o) => o.id)).toEqual(["late", "later"])
  })
})

describe("assessRisk: shorter warnings", () => {
  const now = new Date(2026, 9, 12)

  it("gives a weekly deadline missed four times one warning, not four", () => {
    const { upcoming } = buildSchedule(
      profileWith({ deadlines: [deadline({ firstDueDate: "2026-09-21" })] }),
      [],
      now
    )
    const overdue = upcoming.filter((o) => o.date < "2026-10-12")
    expect(overdue.length).toBeGreaterThan(1)

    const { reasons, level } = assessRisk(upcoming, [], noSignals, now)
    const about = reasons.filter(
      (r) => r.includes("Food bank pickup") && /missed|not marked/.test(r)
    )
    expect(about).toHaveLength(1)
    expect(about[0]).toContain(
      `missed ${overdue.length} since ${short("2026-09-21")}`
    )
    expect(level).toBe("act")
  })

  it("keeps a short line when a repeating item was missed once", () => {
    const { reasons } = assessRisk(
      [
        occurrence({
          date: "2026-10-05",
          title: "Pay rent",
          seriesId: "rent",
          recurring: true,
        }),
      ],
      [],
      noSignals,
      now
    )
    expect(reasons).toContain(`Pay rent · overdue ${short("2026-10-05")}`)
  })

  it("still lists every overdue one-time item on its own", () => {
    const { reasons } = assessRisk(
      [
        occurrence({ id: "a", date: "2026-10-01", title: "Dentist" }),
        occurrence({ id: "b", date: "2026-10-02", title: "DMV letter" }),
      ],
      [],
      noSignals,
      now
    )
    expect(reasons).toEqual([
      `Dentist · overdue ${short("2026-10-01")}`,
      `DMV letter · overdue ${short("2026-10-02")}`,
    ])
  })

  it("mentions a repeating item once when two of its dates fall this week", () => {
    const { reasons } = assessRisk(
      [
        occurrence({
          id: "a",
          date: "2026-10-12",
          title: "Check-in",
          seriesId: "w",
          recurring: true,
        }),
        occurrence({
          id: "b",
          date: "2026-10-18",
          title: "Check-in",
          seriesId: "w",
          recurring: true,
        }),
      ],
      [],
      noSignals,
      now
    )
    expect(reasons).toEqual(["Check-in · due today"])
  })

  it("leads with the most serious warnings", () => {
    const { reasons } = assessRisk(
      [
        occurrence({ id: "soon", date: "2026-10-18", title: "Eye exam" }),
        occurrence({ id: "late", date: "2026-10-01", title: "Dentist" }),
      ],
      [],
      { ...noSignals, lastShutoffNoticeAt: "2026-10-11" },
      now
    )
    expect(reasons[0]).toContain("Dentist")
    expect(reasons[1]).toContain("Shutoff")
    expect(reasons[2]).toContain("Eye exam")
  })
})

describe("buildSchedule: deadlines added by the person", () => {
  const now = new Date(2026, 9, 11, 22, 29) // Oct 11, 10:29 pm local

  it("shows a deadline due today that was added this evening", () => {
    // In a time zone behind UTC this timestamp is already Oct 12.
    const createdAt = now.toISOString()
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [
          deadline({
            id: "t",
            title: "Dentist",
            repeat: null,
            firstDueDate: "2026-10-11",
            createdAt,
          }),
        ],
      }),
      [],
      now
    )
    expect(upcoming.map((o) => o.date)).toEqual(["2026-10-11"])
  })

  it("shows a one-time deadline whose date has already passed, as overdue", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [
          deadline({
            id: "late",
            title: "Send form",
            repeat: null,
            firstDueDate: "2026-10-06",
            createdAt: now.toISOString(),
          }),
          deadline({
            id: "old",
            title: "Court notice",
            repeat: null,
            firstDueDate: "2026-08-20",
            createdAt: now.toISOString(),
          }),
        ],
      }),
      [],
      now
    )
    expect(upcoming.map((o) => o.date)).toEqual(["2026-08-20", "2026-10-06"])
  })

  it("still hides missed dates of a repeating deadline from before it was added", () => {
    const { upcoming } = buildSchedule(
      profileWith({
        deadlines: [
          deadline({
            id: "w",
            repeat: { every: 1, unit: "week" },
            firstDueDate: "2026-09-01",
            createdAt: now.toISOString(),
          }),
        ],
      }),
      [],
      now
    )
    expect(upcoming[0].date >= "2026-10-11").toBe(true)
  })
})
