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
}

export type ScanResult = {
  kind: ScanKind
  summary: string
  // A task to add, when the paper asks her to do something by a date.
  deadline: DeadlineCheck | null
  // A payment to log, when the paper is a receipt.
  payment: ScannedPayment | null
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

export function checkScan(reading: ScanReading, today: string): ScanResult {
  let deadline: DeadlineCheck | null = null

  if (NEEDS_ACTION.includes(reading.kind) && (reading.title.trim() || reading.firstDueDate)) {
    const draft = {
      title: reading.title,
      category: reading.category,
      program: reading.program,
      firstDueDate: reading.firstDueDate,
      repeat: reading.repeat,
      whatToBring: reading.whatToBring,
    }
    const notes: string[] = []

    if (draft.firstDueDate && !dateMatchesPrintedText(draft.firstDueDate, reading.dueDateText)) {
      draft.firstDueDate = null
      notes.push("We could not match the date to the words on the paper, so pick it yourself.")
    }

    const checked = checkDeadline(draft, today)
    deadline = { ...checked, notes: [...notes, ...checked.notes] }
  }

  const amount =
    reading.amount != null && Number.isFinite(reading.amount) && reading.amount > 0
      ? Math.round(reading.amount * 100) / 100
      : null

  return {
    kind: reading.kind,
    summary: reading.summary.trim(),
    deadline,
    payment:
      reading.kind === "receipt" || reading.kind === "shutoff_notice"
        ? { amount, paidTo: reading.payee.trim() }
        : null,
    isShutoffNotice: reading.kind === "shutoff_notice",
  }
}
