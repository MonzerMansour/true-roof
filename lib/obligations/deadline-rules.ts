import { programCadenceMonths } from "./program-rules"
import { addDays, isValidRepeat, parseLocalDate, repeatLabel } from "./recurrence"
import {
  programLabel,
  type DeadlineCategory,
  type ProgramKind,
  type Repeat,
} from "./types"

// The referee between the reader (the AI that turns a sentence into fields)
// and the deadline list. The reader suggests. These rules decide. A draft
// with problems cannot be saved. Notes explain anything the rules changed.

export type DeadlineDraft = {
  title: string
  category: DeadlineCategory
  program: ProgramKind | null
  firstDueDate: string | null
  // "HH:MM", 24 hour, or null for no set time. Optional so the reader and the
  // scanner, which never set a time, need not pass it.
  dueTime?: string | null
  repeat: Repeat | null
  whatToBring: string
}

export type DeadlineCheck = {
  draft: DeadlineDraft
  notes: string[]
  problems: string[]
}

// A first due date further out than this is almost always a wrong year.
const MAX_DAYS_AHEAD = 2 * 365
// Older than this and it is history, not a deadline.
const MAX_DAYS_BEHIND = 365

// Words that mean the person actually said when it is due. If none of these
// are in the sentence, any date the reader returns was made up.
const DATE_WORDS =
  /\d|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day)?\b|\b(today|tonight|tomorrow|next|this|end of|first|last|second|third|fourth|fifth|week|month|year)\b/i

export function sentenceMentionsDate(sentence: string): boolean {
  return DATE_WORDS.test(sentence)
}

// Benefit paperwork follows the program's cycle no matter what the reader
// or the person typed. Rent and bills are left as typed: some people pay
// rent every two weeks, and that is not wrong.
export function requiredRepeat(draft: Pick<DeadlineDraft, "category" | "program">): Repeat | null {
  if (draft.category !== "benefit_paperwork" || !draft.program) return null
  const months = programCadenceMonths[draft.program]
  return months ? { every: months, unit: "month" } : null
}

function sameRepeat(a: Repeat | null, b: Repeat | null) {
  if (!a || !b) return a === b
  const months = (r: Repeat) => (r.unit === "year" ? r.every * 12 : r.every)
  if (a.unit === "week" || b.unit === "week") return a.unit === b.unit && a.every === b.every
  return months(a) === months(b)
}

export function checkDeadline(
  input: DeadlineDraft,
  today: string,
  sentence?: string
): DeadlineCheck {
  const draft: DeadlineDraft = { ...input, title: input.title.trim(), whatToBring: input.whatToBring.trim() }
  const notes: string[] = []
  const problems: string[] = []

  if (!draft.title) problems.push("Add what this deadline is for.")

  if (draft.category !== "benefit_paperwork" && draft.program) draft.program = null

  if (sentence !== undefined && draft.firstDueDate && !sentenceMentionsDate(sentence)) {
    draft.firstDueDate = null
    notes.push("You did not say a date, so we left it blank instead of guessing.")
  }

  if (!draft.firstDueDate) {
    problems.push("Pick the date it is due. We do not guess dates.")
  } else if (!parseLocalDate(draft.firstDueDate)) {
    draft.firstDueDate = null
    problems.push("That date does not exist. Pick it again.")
  } else if (draft.firstDueDate > addDays(today, MAX_DAYS_AHEAD)) {
    problems.push("That date is more than 2 years away. Check the year.")
  } else if (draft.firstDueDate < addDays(today, -MAX_DAYS_BEHIND)) {
    problems.push("That date is more than a year ago. Check the year.")
  }

  if (draft.dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.dueTime)) {
    draft.dueTime = null
    problems.push("That time does not look right. Pick it again, or leave it blank.")
  }

  if (!isValidRepeat(draft.repeat)) {
    draft.repeat = null
    problems.push("Pick how often it repeats.")
  }

  const required = requiredRepeat(draft)
  if (required && !sameRepeat(draft.repeat, required)) {
    const name = programLabel[draft.program as ProgramKind]
    notes.push(
      draft.repeat
        ? `${name} paperwork comes ${repeatLabel(required).toLowerCase()}, not ${repeatLabel(draft.repeat).toLowerCase()}. We changed it.`
        : `${name} paperwork comes ${repeatLabel(required).toLowerCase()}, so we set it to repeat.`
    )
    draft.repeat = required
  }

  return { draft, notes, problems }
}
