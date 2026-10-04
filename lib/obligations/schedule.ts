import { billFrequencyLabel, billFrequencyMonths, type ObligationsProfile, type Occurrence } from "./types"

const MONTHS_AHEAD = 12

function nextOccurrenceOf(dueDay: number, from: Date, intervalMonths = 1): Date[] {
  const dates: Date[] = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)

  for (let i = 0; i < MONTHS_AHEAD; i += intervalMonths) {
    const day = Math.min(dueDay, daysInMonth(cursor))
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
    if (date >= startOfDay(from)) {
      dates.push(date)
    }
    cursor.setMonth(cursor.getMonth() + intervalMonths)
  }

  return dates
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseLocalDate(isoDateString: string) {
  const [year, month, day] = isoDateString.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function buildOccurrences(
  profile: ObligationsProfile,
  now = new Date()
): Occurrence[] {
  const occurrences: Occurrence[] = []

  if (profile.rentAmount > 0) {
    for (const date of nextOccurrenceOf(profile.rentDueDay, now)) {
      occurrences.push({
        id: `rent-${isoDate(date)}`,
        date: isoDate(date),
        title: `Pay rent, $${profile.rentAmount.toLocaleString()}`,
        detail: profile.landlordName
          ? `To ${profile.landlordName}`
          : "Rent is due",
        kind: "rent",
        amount: profile.rentAmount,
      })
    }
  }

  for (const utility of profile.utilities) {
    const interval = billFrequencyMonths[utility.frequency] ?? 1
    for (const date of nextOccurrenceOf(utility.dueDay, now, interval)) {
      occurrences.push({
        id: `utility-${utility.id}-${isoDate(date)}`,
        date: isoDate(date),
        title:
          utility.amount != null
            ? `${utility.name} bill due, $${utility.amount.toLocaleString()}`
            : `${utility.name} bill due`,
        detail: billFrequencyLabel[utility.frequency] ?? "Utility payment",
        kind: "utility",
        amount: utility.amount,
      })
    }
  }

  for (const program of profile.programs) {
    if (!program.nextRecertDate) continue
    const date = parseLocalDate(program.nextRecertDate)
    if (Number.isNaN(date.getTime())) continue

    occurrences.push({
      id: `recert-${program.kind}-${program.nextRecertDate}`,
      date: isoDate(date),
      title: `${program.label} recert/report due`,
      detail: "Renew or report to keep this benefit",
      kind: "recert",
      amount: null,
    })
  }

  if (profile.leaseEndDate) {
    const date = parseLocalDate(profile.leaseEndDate)
    if (!Number.isNaN(date.getTime())) {
      occurrences.push({
        id: `lease-${profile.leaseEndDate}`,
        date: isoDate(date),
        title: "Lease renewal",
        detail: "Renew or sign a new lease before this date",
        kind: "lease",
        amount: null,
      })
    }
  }

  if (profile.voucherInspectionDate) {
    const date = parseLocalDate(profile.voucherInspectionDate)
    if (!Number.isNaN(date.getTime())) {
      occurrences.push({
        id: `voucher-inspection-${profile.voucherInspectionDate}`,
        date: isoDate(date),
        title: "Housing voucher inspection",
        detail: "The unit must pass inspection to keep the voucher",
        kind: "voucher_inspection",
        amount: null,
      })
    }
  }

  return occurrences.sort((a, b) => a.date.localeCompare(b.date))
}

function isoDate(date: Date) {
  const local = startOfDay(date)
  const year = local.getFullYear()
  const month = String(local.getMonth() + 1).padStart(2, "0")
  const day = String(local.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  | "lastCheckInFlaggedAt"
>

function daysSince(iso: string, today: Date) {
  return Math.round(
    (today.getTime() - parseLocalDate(iso).getTime()) / (1000 * 60 * 60 * 24)
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
  const reasons: string[] = []

  for (const occurrence of occurrences) {
    if (completed.has(occurrence.id)) continue

    const date = parseLocalDate(occurrence.date)
    const daysUntil = Math.round(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntil < 0) {
      score += 40
      reasons.push(
        `${occurrence.title} was due ${isoDate(date)} and is not marked done`
      )
    } else if (daysUntil <= 3) {
      score += 20
      reasons.push(`${occurrence.title} is due in ${daysUntil} day(s)`)
    } else if (daysUntil <= 7) {
      score += 10
      reasons.push(`${occurrence.title} is due in ${daysUntil} day(s)`)
    }
  }

  if (
    signals.monthlyIncome != null &&
    signals.previousMonthlyIncome != null &&
    signals.incomeUpdatedAt &&
    signals.monthlyIncome < signals.previousMonthlyIncome * 0.9 &&
    daysSince(signals.incomeUpdatedAt, today) <= 30
  ) {
    score += 15
    reasons.push(
      `Income dropped from $${signals.previousMonthlyIncome.toLocaleString()} to $${signals.monthlyIncome.toLocaleString()}`
    )
  }

  if (
    signals.lastShutoffNoticeAt &&
    daysSince(signals.lastShutoffNoticeAt, today) <= 14
  ) {
    score += 25
    reasons.push(
      `A shutoff or disconnection notice was logged on ${signals.lastShutoffNoticeAt}`
    )
  }

  const daysSinceCheckIn = signals.lastCheckInAt
    ? daysSince(signals.lastCheckInAt, today)
    : null
  if (daysSinceCheckIn === null || daysSinceCheckIn > 7) {
    score += 10
    reasons.push(
      daysSinceCheckIn === null
        ? "You have not checked in yet"
        : `No check-in in ${daysSinceCheckIn} days`
    )
  }

  if (
    signals.lastCheckInFlaggedAt &&
    daysSince(signals.lastCheckInFlaggedAt, today) <= 7
  ) {
    score += 25
    reasons.push(
      `You flagged something's off at your check-in on ${signals.lastCheckInFlaggedAt}`
    )
  }

  const level: RiskLevel = score >= 40 ? "act" : score >= 10 ? "watch" : "steady"

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
