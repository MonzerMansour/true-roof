import { checkDeadline, type DeadlineCheck } from "./deadline-rules"
import { parseLocalDate } from "./recurrence"
import type { DeadlineCategory, ProgramKind, Repeat } from "./types"

// The referee for a scanned photo. The reader says what the paper is and
// copies the due date exactly as printed. These rules only keep a date that
// matches those printed words, then run the same program rules as a typed
// deadline. Nothing here is saved: the person confirms first.

export type ScanKind = "deadline_letter" | "bill" | "shutoff_notice" | "receipt" | "other"

export const scanKindLabel: Record<ScanKind, string> = {
  deadline_letter: "Letter with a deadline",
  bill: "Bill",
  shutoff_notice: "Shutoff notice",
  receipt: "Receipt",
  other: "Something else",
}

// What the reader returns, already type-checked.
export type ScanReading = {
  kind: ScanKind
  summary: string
  title: string
  category: DeadlineCategory
  program: ProgramKind | null
  firstDueDate: string | null
  dueDateText: string | null
  repeat: Repeat | null
  whatToBring: string
  amount: number | null
  payee: string
}

export type ScannedPayment = {
  amount: number | null
  paidTo: string
  /** Prefilled note, so the logged payment says what it was for without the
   * person retyping it. */
  note: string
  /** A receipt is money already gone. A bill or a shutoff notice is money
   * still owed. Both are worth filling in, but calling a bill "paid" would
   * put a payment in the log that never happened. */
  status: "paid" | "owed"
}

/** The facts the reader took off the paper, kept so they can be shown back.
 *
 * These were being read and then dropped on the floor for anything that was
 * not a deadline: a receipt's amount and payee went into the form but the
 * person never saw what had been read, and what the paper said to bring was
 * lost entirely unless there was a date to hang it on. */
export type ScanFacts = {
  amount: number | null
  payee: string
  /** The due date as printed on the paper, not as we parsed it. */
  dueDateText: string | null
  whatToBring: string
}

export type ScanResult = {
  kind: ScanKind
  summary: string
  // A task to add, when the paper asks her to do something by a date.
  deadline: DeadlineCheck | null
  // Money to log. Set for anything carrying an amount or a payee, not only
  // for receipts: a bill is the commonest paper somebody wants to log.
  payment: ScannedPayment | null
  /** What was read, for showing back. Always present. */
  facts: ScanFacts
  isShutoffNotice: boolean
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

// True when `iso` is the date written in `printed`. The day must appear as a
// number. A year or month name in the text, if there is one, must agree.
// "October 15, 2026", "10/15/2026", and "the 15th" all match 2026-10-15.
export function dateMatchesPrintedText(iso: string, printed: string | null): boolean {
  const date = parseLocalDate(iso)
  if (!date || !printed) return false
  const text = printed.toLowerCase()

  const day = date.getDate()
  const dayPattern = new RegExp(`(^|[^0-9])0?${day}(st|nd|rd|th)?([^0-9]|$)`)
  if (!dayPattern.test(text)) return false

  const years = text.match(/\b(19|20)\d{2}\b/g)
  if (years && !years.includes(String(date.getFullYear()))) return false

  const monthsNamed = MONTHS.filter((m) => new RegExp(`\\b${m}[a-z]*\\b`).test(text))
  if (monthsNamed.length > 0 && !monthsNamed.includes(MONTHS[date.getMonth()])) return false

  return true
}

const NEEDS_ACTION: ScanKind[] = ["deadline_letter", "bill", "shutoff_notice"]

/** Money already handed over, rather than money still owed. */
const ALREADY_PAID: ScanKind[] = ["receipt"]

/** The note to prefill, built from what the paper actually says rather than
 * left for the person to type again. Summary first, because that is the line
 * they will recognise on the payment list months later. */
export function noteFromReading(reading: ScanReading): string {
  const parts = [reading.summary.trim(), reading.whatToBring.trim()].filter(Boolean)
  const note = parts.join(" ")
  // The note sits on one line in the payment list, so keep it short enough to
  // read there rather than letting a whole paragraph through.
  return note.length > 160 ? `${note.slice(0, 157).trimEnd()}...` : note
}

/** A payment already in the log that looks like this one.
 *
 * Stops a second rent payment appearing because somebody photographed the
 * same receipt twice, which is easy to do when the first scan is still on
 * screen. Matching is deliberately loose on the payee and exact on the
 * amount: "Westgate" and "Westgate Property Management" are the same
 * landlord, but $1,450 and $1,540 are not the same payment. */
export function findDuplicatePayment(
  candidate: { amount: number | null; paidTo: string },
  logged: readonly { id: string; amount: number; paidTo: string; loggedAt: string }[],
  now: Date = new Date()
) {
  if (candidate.amount == null) return null

  const name = candidate.paidTo.trim().toLowerCase()
  const windowStart = now.getTime() - 60 * 24 * 60 * 60 * 1000

  return (
    logged.find((entry) => {
      if (entry.amount !== candidate.amount) return false
      const at = new Date(entry.loggedAt).getTime()
      if (!Number.isFinite(at) || at < windowStart) return false
      if (!name) return true
      const other = entry.paidTo.trim().toLowerCase()
      if (!other) return false
      return other.includes(name) || name.includes(other)
    }) ?? null
  )
}

export function checkScan(reading: ScanReading, today: string): ScanResult {
  const amount =
    reading.amount != null && Number.isFinite(reading.amount) && reading.amount > 0
      ? Math.round(reading.amount * 100) / 100
      : null

  let deadline: DeadlineCheck | null = null

  if (NEEDS_ACTION.includes(reading.kind) && (reading.title.trim() || reading.firstDueDate)) {
    const draft = {
      title: reading.title,
      category: reading.category,
      program: reading.program,
      firstDueDate: reading.firstDueDate,
      repeat: reading.repeat,
      whatToBring: reading.whatToBring,
      // The money belongs on the deadline too, so the calendar can show what
      // is owed on the day it is owed. It stays editable.
      amount,
    }
    const notes: string[] = []

    if (draft.firstDueDate && !dateMatchesPrintedText(draft.firstDueDate, reading.dueDateText)) {
      draft.firstDueDate = null
      notes.push("We could not match the date to the words on the paper, so pick it yourself.")
    }

    const checked = checkDeadline(draft, today)
    deadline = { ...checked, notes: [...notes, ...checked.notes] }
  }

  const payee = reading.payee.trim()

  // Anything with money on it is worth filling in, not just a receipt. A bill
  // was the one paper most likely to be logged and the one that offered the
  // least help: its amount and payee were read and then thrown away.
  const hasMoney = amount != null || payee.length > 0

  return {
    kind: reading.kind,
    summary: reading.summary.trim(),
    deadline,
    payment:
      hasMoney && reading.kind !== "other"
        ? {
            amount,
            paidTo: payee,
            note: noteFromReading(reading),
            status: ALREADY_PAID.includes(reading.kind) ? "paid" : "owed",
          }
        : null,
    facts: {
      amount,
      payee,
      dueDateText: reading.dueDateText?.trim() || null,
      whatToBring: reading.whatToBring.trim(),
    },
    isShutoffNotice: reading.kind === "shutoff_notice",
  }
}
