import { describe, expect, it } from "vitest"

import {
  checkScan,
  dateMatchesPrintedText,
  type ScanReading,
} from "@/lib/obligations/scan-rules"

const TODAY = "2026-10-03"

const sar7: ScanReading = {
  kind: "deadline_letter",
  summary: "CalFresh says your semi-annual report is due.",
  title: "Send CalFresh report",
  category: "benefit_paperwork",
  program: "calfresh",
  firstDueDate: "2026-10-15",
  dueDateText: "October 15, 2026",
  repeat: null,
  whatToBring: "Last 2 pay stubs",
  amount: null,
  payee: "",
}

describe("dateMatchesPrintedText", () => {
  it("matches the date written many ways", () => {
    for (const text of ["October 15, 2026", "10/15/2026", "Oct 15", "the 15th", "15 OCT 2026"]) {
      expect(dateMatchesPrintedText("2026-10-15", text)).toBe(true)
    }
  })

  it("matches a leading zero", () => {
    expect(dateMatchesPrintedText("2026-11-05", "11/05/2026")).toBe(true)
  })

  it("rejects a different day, month, or year", () => {
    expect(dateMatchesPrintedText("2026-10-15", "October 16, 2026")).toBe(false)
    expect(dateMatchesPrintedText("2026-10-15", "November 15, 2026")).toBe(false)
    expect(dateMatchesPrintedText("2026-10-15", "October 15, 2025")).toBe(false)
  })

  it("does not find the 5th inside 15 or 2025", () => {
    expect(dateMatchesPrintedText("2026-10-05", "October 15, 2025")).toBe(false)
  })

  it("rejects a date with no printed words behind it", () => {
    expect(dateMatchesPrintedText("2026-10-15", null)).toBe(false)
    expect(dateMatchesPrintedText("2026-10-15", "as soon as possible")).toBe(false)
  })
})

describe("checkScan", () => {
  it("turns a SAR 7 letter into one task that repeats every 6 months", () => {
    const result = checkScan(sar7, TODAY)
    expect(result.deadline?.problems).toEqual([])
    expect(result.deadline?.draft.firstDueDate).toBe("2026-10-15")
    expect(result.deadline?.draft.repeat).toEqual({ every: 6, unit: "month" })
    expect(result.payment).toBeNull()
  })

  it("blanks a date the reader got wrong instead of saving it", () => {
    const result = checkScan({ ...sar7, firstDueDate: "2026-10-25" }, TODAY)
    expect(result.deadline?.draft.firstDueDate).toBeNull()
    expect(result.deadline?.notes[0]).toMatch(/could not match the date/)
    expect(result.deadline?.problems).toContain("Pick the date it is due. We do not guess dates.")
  })

  it("logs a receipt as a payment, not a task", () => {
    const result = checkScan(
      {
        ...sar7,
        kind: "receipt",
        title: "",
        firstDueDate: null,
        dueDateText: null,
        amount: 400.004,
        payee: "Westgate",
      },
      TODAY
    )
    expect(result.deadline).toBeNull()
    expect(result.payment).toEqual({ amount: 400, paidTo: "Westgate" })
  })

  it("flags a shutoff notice and gives both a task and the payment form", () => {
    const result = checkScan(
      {
        ...sar7,
        kind: "shutoff_notice",
        title: "Pay PG&E to stop shutoff",
        category: "bill",
        program: null,
        firstDueDate: "2026-10-10",
        dueDateText: "10/10/2026",
        amount: 212.5,
        payee: "PG&E",
      },
      TODAY
    )
    expect(result.isShutoffNotice).toBe(true)
    expect(result.deadline?.draft.firstDueDate).toBe("2026-10-10")
    expect(result.payment?.amount).toBe(212.5)
  })

  it("does nothing with an unreadable photo", () => {
    const result = checkScan(
      { ...sar7, kind: "other", title: "", firstDueDate: null, dueDateText: null },
      TODAY
    )
    expect(result.deadline).toBeNull()
    expect(result.payment).toBeNull()
  })

  it("drops a negative or zero amount", () => {
    const result = checkScan({ ...sar7, kind: "receipt", amount: -5 }, TODAY)
    expect(result.payment?.amount).toBeNull()
  })
})
