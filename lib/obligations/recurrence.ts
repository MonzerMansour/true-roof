import type { Repeat } from "./types"

// Pure date math for deadlines that repeat. Every date is a local
// "YYYY-MM-DD" string. Nothing here reads the clock: callers pass `today`.

// Enough for a weekly deadline anchored years back. Stops a bad anchor from
// looping forever.
const MAX_STEPS = 2000

// "YYYY-MM-DD" must be parsed as a local date. `new Date("2026-10-01")` is UTC
// midnight, which is Sep 30 anywhere west of UTC.
export function parseLocalDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  // Rejects "2026-02-30", which Date would quietly roll into March.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function isoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  return isoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days))
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// The nth due date (0 is the first one). Each date is counted from the first
// one, not from the previous one, so a deadline on the 31st lands on Feb 28
// and then goes back to Mar 31 instead of drifting to the 28th forever.
export function nthDueDate(firstDueDate: string, repeat: Repeat | null, n: number): string | null {
  const anchor = parseLocalDate(firstDueDate)
  if (!anchor) return null
  if (n === 0) return firstDueDate
  if (!repeat) return null

  if (repeat.unit === "week") {
    return addDays(firstDueDate, n * repeat.every * 7)
  }

  const monthsPerStep = repeat.unit === "year" ? 12 : 1
  const totalMonths = anchor.getMonth() + n * repeat.every * monthsPerStep
  const year = anchor.getFullYear() + Math.floor(totalMonths / 12)
  const monthIndex = ((totalMonths % 12) + 12) % 12
  const day = Math.min(anchor.getDate(), daysInMonth(year, monthIndex))
  return isoDate(new Date(year, monthIndex, day))
}

// Every due date from `from` through `to`, both inclusive.
export function dueDatesBetween(
  firstDueDate: string,
  repeat: Repeat | null,
  from: string,
  to: string
): string[] {
  if (!parseLocalDate(firstDueDate) || !isValidRepeat(repeat)) return []

  const dates: string[] = []
  for (let n = 0; n < MAX_STEPS; n++) {
    const date = nthDueDate(firstDueDate, repeat, n)
    if (!date || date > to) break
    if (date >= from) dates.push(date)
    if (!repeat) break
  }
  return dates
}

// The first due date on or after `today` that is not marked done. Returns
// null for a one-time deadline that has passed or been done.
export function nextDueDate(
  firstDueDate: string,
  repeat: Repeat | null,
  today: string,
  isDone: (date: string) => boolean = () => false
): string | null {
  if (!parseLocalDate(firstDueDate) || !isValidRepeat(repeat)) return null

  for (let n = 0; n < MAX_STEPS; n++) {
    const date = nthDueDate(firstDueDate, repeat, n)
    if (!date) return null
    if (date >= today && !isDone(date)) return date
    if (!repeat) return null
  }
  return null
}

export function isValidRepeat(repeat: Repeat | null): boolean {
  if (repeat === null) return true
  return (
    Number.isInteger(repeat.every) &&
    repeat.every >= 1 &&
    repeat.every <= 24 &&
    (repeat.unit === "week" || repeat.unit === "month" || repeat.unit === "year")
  )
}

export function repeatLabel(repeat: Repeat | null): string {
  if (!repeat) return "One time"
  if (repeat.every === 1) {
    return { week: "Every week", month: "Every month", year: "Every year" }[repeat.unit]
  }
  return `Every ${repeat.every} ${repeat.unit}s`
}
