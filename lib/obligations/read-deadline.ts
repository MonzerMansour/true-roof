// Server only. Never import this from a client component.
//
// Turns one sentence ("CalFresh report due the 15th, bring pay stubs") into
// deadline fields. The model only fills the form. `checkDeadline` in
// deadline-rules.ts decides what is kept, and the person confirms before
// anything is saved.
import type { DeadlineDraft } from "./deadline-rules"
import { readJson, todayLine } from "./openai-json"
import type { DeadlineCategory, ProgramKind, RepeatUnit } from "./types"

export const CATEGORIES: DeadlineCategory[] = ["rent", "bill", "benefit_paperwork", "appointment", "other"]
export const PROGRAMS: ProgramKind[] = ["calfresh", "medi_cal", "housing_voucher", "other"]
export const UNITS: RepeatUnit[] = ["week", "month", "year"]

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "category", "program", "firstDueDate", "repeatEvery", "repeatUnit", "whatToBring"],
  properties: {
    title: {
      type: "string",
      description: "Short plain task, starting with a verb. Example: Send CalFresh report.",
    },
    category: { type: "string", enum: CATEGORIES },
    program: {
      type: ["string", "null"],
      enum: [...PROGRAMS, null],
      description: "Only for benefit paperwork. CalFresh, SAR 7 and food stamps are calfresh. Section 8 and HCV are housing_voucher.",
    },
    firstDueDate: {
      type: ["string", "null"],
      description: "YYYY-MM-DD, the next time it is due on or after today. Null if the sentence does not say when.",
    },
    repeatEvery: { type: ["integer", "null"] },
    repeatUnit: { type: ["string", "null"], enum: [...UNITS, null] },
    whatToBring: {
      type: "string",
      description: "Only what the sentence says to bring or send. Empty string if it says nothing.",
    },
  },
} as const

function instructions(today: string) {
  return [
    todayLine(today),
    "A person who just got housed is telling you about one bill, payment, or paperwork deadline.",
    "Fill in the fields from what they said.",
    "Dates: if they give a day of the month but no month, use the next one on or after today. If they say a weekday, use the next one. If they give no date at all, return null. Never pick a date from what you know about a program.",
    "Repeats: set it when they say it repeats, or when it is plainly recurring (rent, a phone or power bill, a CalFresh report). A one-time appointment does not repeat. Otherwise both repeat fields are null.",
    "Write the title in plain words a tired person can read at a glance.",
  ].join("\n")
}

export type ReaderOutput = {
  title: string
  category: DeadlineCategory
  program: ProgramKind | null
  firstDueDate: string | null
  repeatEvery: number | null
  repeatUnit: RepeatUnit | null
  whatToBring: string
}

export async function readDeadline(sentence: string, today: string): Promise<DeadlineDraft> {
  const out = await readJson<ReaderOutput>({
    name: "deadline",
    schema,
    instructions: instructions(today),
    content: sentence,
  })
  return toDraft(out)
}

// Strict mode should guarantee this shape. Check anyway: the rules downstream
// trust these types.
export function toDraft(out: ReaderOutput): DeadlineDraft {
  const category = CATEGORIES.includes(out.category) ? out.category : "other"
  const program = out.program && PROGRAMS.includes(out.program) ? out.program : null
  const repeat =
    out.repeatEvery != null && out.repeatUnit && UNITS.includes(out.repeatUnit)
      ? { every: out.repeatEvery, unit: out.repeatUnit }
      : null

  return {
    title: typeof out.title === "string" ? out.title : "",
    category,
    program,
    firstDueDate: typeof out.firstDueDate === "string" ? out.firstDueDate : null,
    repeat,
    whatToBring: typeof out.whatToBring === "string" ? out.whatToBring : "",
  }
}
