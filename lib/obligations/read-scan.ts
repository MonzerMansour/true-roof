// Server only. Never import this from a client component.
//
// Reads one photo of a letter, bill, or receipt. The photo is passed straight
// through to the reader and never written anywhere. `checkScan` in
// scan-rules.ts decides what is kept.
import { readJson, todayLine } from "./openai-json"
import { CATEGORIES, PROGRAMS, UNITS } from "./read-deadline"
import type { ScanKind, ScanReading } from "./scan-rules"
import type { DeadlineCategory, ProgramKind, RepeatUnit } from "./types"

const KINDS: ScanKind[] = ["deadline_letter", "bill", "shutoff_notice", "receipt", "other"]

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "summary",
    "title",
    "category",
    "program",
    "firstDueDate",
    "dueDateText",
    "repeatEvery",
    "repeatUnit",
    "whatToBring",
    "amount",
    "payee",
  ],
  properties: {
    kind: {
      type: "string",
      enum: KINDS,
      description:
        "deadline_letter: asks her to send, renew, report, or show up by a date. bill: money owed by a date. shutoff_notice: power, gas, water, or phone will be cut off. receipt: proof she already paid. other: none of these, or unreadable.",
    },
    summary: {
      type: "string",
      description: "One short plain sentence saying what this paper is and who sent it. No jargon.",
    },
    title: {
      type: "string",
      description: "The one thing she must do, starting with a verb. Example: Send CalFresh report. Empty if nothing.",
    },
    category: { type: "string", enum: CATEGORIES },
    program: {
      type: ["string", "null"],
      enum: [...PROGRAMS, null],
      description: "Only for benefit paperwork. SAR 7 and CalFresh are calfresh. Section 8, HCV, and housing authority reviews are housing_voucher.",
    },
    firstDueDate: {
      type: ["string", "null"],
      description: "The due date printed on the paper as YYYY-MM-DD. Null if none is printed.",
    },
    dueDateText: {
      type: ["string", "null"],
      description: "The due date copied exactly as printed, character for character. Null if none.",
    },
    repeatEvery: { type: ["integer", "null"] },
    repeatUnit: { type: ["string", "null"], enum: [...UNITS, null] },
    whatToBring: {
      type: "string",
      description: "What the paper says to send or bring, in plain words. Empty if it says nothing.",
    },
    amount: {
      type: ["number", "null"],
      description: "For a receipt, the amount paid. For a bill or shutoff notice, the amount owed. Null if none.",
    },
    payee: {
      type: "string",
      description: "Who is paid or owed: landlord, utility, or agency name. Empty if none.",
    },
  },
} as const

function instructions(today: string) {
  return [
    todayLine(today),
    "You are looking at a photo of one piece of paper mail or a receipt belonging to someone who was recently housed.",
    "Read only what is printed. Never fill in a date, amount, or program from what you know about how programs usually work.",
    "If the photo is blurry, cut off, or not a document, use kind other and leave the fields empty or null.",
    "Repeats: set them only when the paper says it repeats, or it is a CalFresh report, Medi-Cal renewal, or housing voucher review, or a monthly bill.",
    "Write the title and summary so a tired person can read them at a glance.",
  ].join("\n")
}

type ScanOutput = Omit<ScanReading, "repeat"> & {
  repeatEvery: number | null
  repeatUnit: RepeatUnit | null
}

export async function readScan(imageDataUrl: string, today: string): Promise<ScanReading> {
  const out = await readJson<ScanOutput>({
    name: "scan",
    schema,
    instructions: instructions(today),
    content: [
      { type: "text", text: "Read this paper." },
      { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
    ],
  })

  // Strict mode should guarantee this shape. Check anyway.
  const str = (v: unknown) => (typeof v === "string" ? v : "")
  return {
    kind: KINDS.includes(out.kind) ? out.kind : "other",
    summary: str(out.summary),
    title: str(out.title),
    category: CATEGORIES.includes(out.category as DeadlineCategory) ? out.category : "other",
    program: out.program && PROGRAMS.includes(out.program as ProgramKind) ? out.program : null,
    firstDueDate: typeof out.firstDueDate === "string" ? out.firstDueDate : null,
    dueDateText: typeof out.dueDateText === "string" ? out.dueDateText : null,
    repeat:
      out.repeatEvery != null && out.repeatUnit && UNITS.includes(out.repeatUnit)
        ? { every: out.repeatEvery, unit: out.repeatUnit }
        : null,
    whatToBring: str(out.whatToBring),
    amount: typeof out.amount === "number" ? out.amount : null,
    payee: str(out.payee),
  }
}
