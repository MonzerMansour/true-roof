import { programCadenceMonths } from "./program-rules"
import {
  addDays,
  dueDatesBetween,
  isoDate,
  parseLocalDate,
  repeatLabel,
} from "./recurrence"
import {
  billFrequencyLabel,
  billFrequencyMonths,
  type ObligationsProfile,
  type Occurrence,
  type Repeat,
} from "./types"

// A done item can be undone for this long. After that it drops off the Done list.
const DONE_LOOKBACK_DAYS = 90
// How far ahead to look for the next date after everything this year is done.
const YEARS_AHEAD = 5

// Rent and utilities only store a day of the month. Counting from one fixed
// month keeps an every-2-months bill on the same months forever.
const DAY_OF_MONTH_ANCHOR = "2024-01"

// One repeating thing (rent, a bill, a program, a typed deadline) and the
// earliest date that can still show as to-do.
type Series = {
  key: string
  firstDueDate: string
  repeat: Repeat | null
  showFrom: string
  // Dates deleted one at a time. They never show, done or not.
  skip?: string[]
  make: (date: string) => Occurrence
}

export type Schedule = {
  // To-do items, oldest first. Overdue ones stay until marked done.
  upcoming: Occurrence[]
  // Marked done recently, newest first, so they can be undone.
  done: Occurrence[]
}

function dayOfMonthAnchor(day: number) {
  return `${DAY_OF_MONTH_ANCHOR}-${String(Math.min(Math.max(day, 1), 31)).padStart(2, "0")}`
}

function buildSeries(profile: ObligationsProfile, today: string): Series[] {
  const series: Series[] = []

  if (profile.rentAmount > 0) {
    series.push({
      key: "rent",
      firstDueDate: dayOfMonthAnchor(profile.rentDueDay),
      repeat: { every: 1, unit: "month" },
      showFrom: today,
      make: (date) => ({
        id: `rent-${date}`,
        date,
        title: "Pay rent",
        detail: profile.landlordName
          ? `To ${profile.landlordName}`
          : "Rent is due",
        kind: "rent",
        amount: profile.rentAmount,
      }),
    })
  }

  for (const utility of profile.utilities) {
    series.push({
      key: `utility-${utility.id}`,
      firstDueDate: dayOfMonthAnchor(utility.dueDay),
      repeat: {
        every: billFrequencyMonths[utility.frequency] ?? 1,
        unit: "month",
      },
      showFrom: today,
      make: (date) => ({
        id: `utility-${utility.id}-${date}`,
        date,
        title: `${utility.name} bill due`,
        detail: billFrequencyLabel[utility.frequency] ?? "Utility payment",
        kind: "utility",
        amount: utility.amount,
      }),
    })
  }

  // The date she entered is one cycle. The program's cadence writes the rest.
  for (const program of profile.programs) {
    if (!parseLocalDate(program.nextRecertDate)) continue
    const months = programCadenceMonths[program.kind]
    series.push({
      key: `recert-${program.kind}`,
      firstDueDate: program.nextRecertDate,
      repeat: months ? { every: months, unit: "month" } : null,
      showFrom: program.nextRecertDate,
      make: (date) => ({
        id: `recert-${program.kind}-${date}`,
        date,
        title: `${program.label} recert/report due`,
        detail: "Renew or report to keep this benefit",
        kind: "recert",
        amount: null,
      }),
    })
  }

  for (const deadline of profile.deadlines ?? []) {
    // A repeating one shows missed dates for 30 days so they can count as
    // overdue, but never one from before it was added. A one-time deadline
    // shows until it is done: the person typed that date, so a date that has
    // already passed is something to catch up on, not something to hide.
    const lookback = addDays(today, -30)
    // The day it was added in the person's own calendar. createdAt is a UTC
    // timestamp, so slicing it gives tomorrow's date in the evening west of
    // Greenwich and hid anything due today.
    const added = isoDate(new Date(deadline.createdAt))
    series.push({
      key: `deadline-${deadline.id}`,
      firstDueDate: deadline.firstDueDate,
      repeat: deadline.repeat,
      showFrom: deadline.repeat
        ? added > lookback
          ? added
          : lookback
        : deadline.firstDueDate,
      skip: deadline.skippedDates,
      make: (date) => ({
        id: `deadline-${deadline.id}-${date}`,
        date,
        title: deadline.title,
        detail: deadline.whatToBring
          ? `Bring: ${deadline.whatToBring}`
          : repeatLabel(deadline.repeat),
        kind: "deadline",
        amount: deadline.amount ?? null,
        time: deadline.dueTime ?? null,
        deadlineId: deadline.id,
        repeats: Boolean(deadline.repeat),
      }),
    })
  }

  if (parseLocalDate(profile.leaseEndDate)) {
    series.push({
      key: "lease",
      firstDueDate: profile.leaseEndDate,
      repeat: null,
      showFrom: profile.leaseEndDate,
      make: (date) => ({
        id: `lease-${date}`,
        date,
        title: "Lease renewal",
        detail: "Renew or sign a new lease before this date",
        kind: "lease",
        amount: null,
      }),
    })
  }

  if (parseLocalDate(profile.voucherInspectionDate)) {
    series.push({
      key: "voucher-inspection",
      firstDueDate: profile.voucherInspectionDate,
      repeat: null,
      showFrom: profile.voucherInspectionDate,
      make: (date) => ({
        id: `voucher-inspection-${date}`,
        date,
        title: "Housing voucher inspection",
        detail: "The unit must pass inspection to keep the voucher",
        kind: "voucher_inspection",
        amount: null,
      }),
    })
  }

  return series
}

// Each repeating item shows its dates for the rest of this calendar year.
// Marking one done hides it and pulls in the next one, even if that is next
// year, so the count per item stays the same. Every item always shows at
// least its next date, so a yearly review in March still appears in October.
export function buildSchedule(
  profile: ObligationsProfile,
  completedIds: string[],
  now = new Date()
): Schedule {
  const today = isoDate(now)
  const yearEnd = `${now.getFullYear()}-12-31`
  const searchEnd = `${now.getFullYear() + YEARS_AHEAD}-12-31`
  const doneFrom = addDays(today, -DONE_LOOKBACK_DAYS)
  const completed = new Set(completedIds)

  const upcoming: Occurrence[] = []
  const done: Occurrence[] = []

  for (const s of buildSeries(profile, today)) {
    const searchFrom = s.showFrom < doneFrom ? s.showFrom : doneFrom
    const skipped = new Set(s.skip ?? [])
    const occurrences = dueDatesBetween(
      s.firstDueDate,
      s.repeat,
      searchFrom,
      searchEnd
    )
      .filter((date) => !skipped.has(date))
      .map((date) => ({
        ...s.make(date),
        seriesId: s.key,
        recurring: Boolean(s.repeat),
      }))

    const showable = occurrences.filter((o) => o.date >= s.showFrom)
    const perYear = Math.max(
      1,
      showable.filter((o) => o.date <= yearEnd).length
    )

    upcoming.push(
      ...showable.filter((o) => !completed.has(o.id)).slice(0, perYear)
    )
    done.push(
      ...occurrences.filter((o) => completed.has(o.id) && o.date >= doneFrom)
    )
  }

  return {
    // By day, then by time within a day. Untimed items come first.
    upcoming: upcoming.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "")
    ),
    done: done.sort((a, b) => b.date.localeCompare(a.date)),
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export type RiskLevel = "steady" | "watch" | "act"

export type RiskAssessment = {
  level: RiskLevel
  score: number
  reasons: string[]
}

type RiskSignals = Pick<
  ObligationsProfile,
  | "monthlyIncome"
  | "previousMonthlyIncome"
  | "incomeUpdatedAt"
  | "lastShutoffNoticeAt"
  | "lastCheckInAt"
>

// "Oct 6", in the person's own language, for warnings.
function shortDate(iso: string) {
  const date = parseLocalDate(iso)
  return date
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : iso
}

function daysSince(iso: string, today: Date) {
  return Math.round(
    (today.getTime() - (parseLocalDate(iso) ?? today).getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

export function assessRisk(
  occurrences: Occurrence[],
  completedIds: string[],
  signals: RiskSignals,
  now = new Date()
): RiskAssessment {
  const today = startOfDay(now)
  const completed = new Set(completedIds)
  let score = 0
  // Each reason carries the points it added, so the list can lead with the
  // most serious ones.
  const found: { text: string; points: number }[] = []
  const add = (text: string, points: number) => {
    score += points
    found.push({ text, points })
  }

  // A repeating item that was missed several times is one warning, not one
  // per missed date.
  const overdueSeries = new Map<string, Occurrence[]>()
  const dueSoonSeries = new Set<string>()

  for (const occurrence of occurrences) {
    if (completed.has(occurrence.id)) continue

    const date = parseLocalDate(occurrence.date)
    if (!date) continue
    const daysUntil = Math.round(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntil < 0) {
      score += 40
      if (occurrence.recurring && occurrence.seriesId) {
        const list = overdueSeries.get(occurrence.seriesId) ?? []
        list.push(occurrence)
        overdueSeries.set(occurrence.seriesId, list)
      } else {
        found.push({
          text: `${occurrence.title} · overdue ${shortDate(occurrence.date)}`,
          points: 40,
        })
      }
    } else if (daysUntil <= 7) {
      // A repeating item only needs its soonest date mentioned.
      if (occurrence.recurring && occurrence.seriesId) {
        if (dueSoonSeries.has(occurrence.seriesId)) continue
        dueSoonSeries.add(occurrence.seriesId)
      }
      const when =
        daysUntil === 0
          ? "today"
          : daysUntil === 1
            ? "tomorrow"
            : `in ${daysUntil}d`
      add(`${occurrence.title} · due ${when}`, daysUntil <= 3 ? 20 : 10)
    }
  }

  for (const items of overdueSeries.values()) {
    const oldest = items[0]
    found.push({
      text:
        items.length === 1
          ? `${oldest.title} · overdue ${shortDate(oldest.date)}`
          : `${oldest.title} · missed ${items.length} since ${shortDate(oldest.date)}`,
      points: 40,
    })
  }

  if (
    signals.monthlyIncome != null &&
    signals.previousMonthlyIncome != null &&
    signals.incomeUpdatedAt &&
    signals.monthlyIncome < signals.previousMonthlyIncome * 0.9 &&
    daysSince(signals.incomeUpdatedAt, today) <= 30
  ) {
    add("Income dropped this month", 15)
  }

  if (
    signals.lastShutoffNoticeAt &&
    daysSince(signals.lastShutoffNoticeAt, today) <= 14
  ) {
    add(`Shutoff notice · ${shortDate(signals.lastShutoffNoticeAt)}`, 25)
  }

  const daysSinceCheckIn = signals.lastCheckInAt
    ? daysSince(signals.lastCheckInAt, today)
    : null
  if (daysSinceCheckIn === null || daysSinceCheckIn > 7) {
    add(
      daysSinceCheckIn === null
        ? "Check in"
        : `No check-in · ${daysSinceCheckIn}d`,
      10
    )
  }

  const level: RiskLevel =
    score >= 40 ? "act" : score >= 10 ? "watch" : "steady"

  // Array.sort is stable, so reasons with equal points keep their date order.
  const reasons = found
    .sort((a, b) => b.points - a.points)
    .map((reason) => reason.text)

  return { level, score, reasons }
}

export function upcomingOccurrences(
  occurrences: Occurrence[],
  completedIds: string[],
  limit = 6
) {
  const completed = new Set(completedIds)
  return occurrences.filter((o) => !completed.has(o.id)).slice(0, limit)
}
