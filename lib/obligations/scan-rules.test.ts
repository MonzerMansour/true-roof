import { describe, expect, it } from "vitest"

import {
  checkScan,
  dateMatchesPrintedText,
  findDuplicatePayment,
  noteFromReading,
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
    expect(result.payment?.amount).toBe(400)
    expect(result.payment?.paidTo).toBe("Westgate")
    expect(result.payment?.status).toBe("paid")
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
    const result = checkScan(
      { ...sar7, kind: "receipt", amount: -5, payee: "Westgate" },
      TODAY
    )
    // The payee is still worth prefilling; the nonsense amount is not.
    expect(result.payment?.paidTo).toBe("Westgate")
    expect(result.payment?.amount).toBeNull()
  })

  it("offers nothing when a receipt has neither an amount nor a payee", () => {
    // Prefilling an empty form helps nobody, and the blank form to type one
    // in by hand is on the page already.
    const result = checkScan({ ...sar7, kind: "receipt", amount: -5 }, TODAY)
    expect(result.payment).toBeNull()
  })
})

const pgeBill: ScanReading = {
  kind: "bill",
  summary: "PG&E bill for September.",
  title: "Pay PG&E bill",
  category: "bill",
  program: null,
  firstDueDate: "2026-10-20",
  dueDateText: "Due October 20, 2026",
  repeat: { every: 1, unit: "month" },
  whatToBring: "",
  amount: 148.52,
  payee: "PG&E",
}

const rentReceipt: ScanReading = {
  kind: "receipt",
  summary: "Rent receipt for October.",
  title: "",
  category: "other",
  program: null,
  firstDueDate: null,
  dueDateText: null,
  repeat: null,
  whatToBring: "",
  amount: 1450,
  payee: "Westgate Property Management",
}

describe("money on the paper is offered for logging", () => {
  it("fills in a bill, not only a receipt", () => {
    // The gap this closes: a bill is the paper somebody most often wants to
    // log, and its amount and payee were read off the page and then dropped.
    const result = checkScan(pgeBill, TODAY)

    expect(result.payment).not.toBeNull()
    expect(result.payment?.amount).toBe(148.52)
    expect(result.payment?.paidTo).toBe("PG&E")
  })

  it("does not call a bill paid", () => {
    // A bill is money owed. Logging it as paid would put a payment in the log
    // that never happened.
    expect(checkScan(pgeBill, TODAY).payment?.status).toBe("owed")
    expect(checkScan(rentReceipt, TODAY).payment?.status).toBe("paid")
  })

  it("offers nothing to log when there is no money on the paper", () => {
    expect(checkScan(sar7, TODAY).payment).toBeNull()
  })

  it("offers nothing for a paper it could not read", () => {
    const unreadable: ScanReading = {
      ...pgeBill,
      kind: "other",
      title: "",
      summary: "",
    }
    expect(checkScan(unreadable, TODAY).payment).toBeNull()
  })

  it("still fills in a payee with no amount, so the name is not retyped", () => {
    const noAmount = { ...pgeBill, amount: null }
    expect(checkScan(noAmount, TODAY).payment?.paidTo).toBe("PG&E")
    expect(checkScan(noAmount, TODAY).payment?.amount).toBeNull()
  })
})

describe("what was read is kept for showing back", () => {
  it("keeps the amount, payee, printed date and what it asks for", () => {
    const result = checkScan(sar7, TODAY)
    // Nothing here is money, but the person should still see what was read.
    expect(result.facts.whatToBring).toBe("Last 2 pay stubs")
    expect(result.facts.dueDateText).toBe("October 15, 2026")

    const bill = checkScan(pgeBill, TODAY)
    expect(bill.facts.amount).toBe(148.52)
    expect(bill.facts.payee).toBe("PG&E")
  })
})

describe("noteFromReading", () => {
  it("joins what the paper is to what it asks for", () => {
    expect(noteFromReading(sar7)).toBe(
      "CalFresh says your semi-annual report is due. Last 2 pay stubs"
    )
  })

  it("is empty when the paper said nothing", () => {
    expect(noteFromReading({ ...sar7, summary: "", whatToBring: "" })).toBe("")
  })

  it("keeps the note short enough to read on one line", () => {
    const long = { ...sar7, summary: "x".repeat(400) }
    const note = noteFromReading(long)
    expect(note.length).toBeLessThanOrEqual(160)
    expect(note.endsWith("...")).toBe(true)
  })
})

describe("findDuplicatePayment", () => {
  const now = new Date("2026-10-03T12:00:00Z")
  const logged = [
    {
      id: "p1",
      amount: 1450,
      paidTo: "Westgate Property Management",
      loggedAt: "2026-10-01T10:00:00Z",
    },
  ]

  it("matches the same amount to a shorter version of the name", () => {
    // Somebody photographing the same receipt twice is easy, and "Westgate"
    // and "Westgate Property Management" are the same landlord.
    expect(
      findDuplicatePayment({ amount: 1450, paidTo: "Westgate" }, logged, now)
    ).not.toBeNull()
  })

  it("does not match a different amount", () => {
    expect(
      findDuplicatePayment({ amount: 1540, paidTo: "Westgate" }, logged, now)
    ).toBeNull()
  })

  it("does not match a different payee", () => {
    expect(
      findDuplicatePayment({ amount: 1450, paidTo: "PG&E" }, logged, now)
    ).toBeNull()
  })

  it("ignores anything logged long ago", () => {
    // Rent repeats. Last October's payment is not this October's.
    const old = [{ ...logged[0], loggedAt: "2026-01-01T10:00:00Z" }]
    expect(
      findDuplicatePayment({ amount: 1450, paidTo: "Westgate" }, old, now)
    ).toBeNull()
  })

  it("says nothing when there is no amount to compare", () => {
    expect(
      findDuplicatePayment({ amount: null, paidTo: "Westgate" }, logged, now)
    ).toBeNull()
  })

  it("survives a damaged timestamp rather than throwing", () => {
    const bad = [{ ...logged[0], loggedAt: "not a date" }]
    expect(
      findDuplicatePayment({ amount: 1450, paidTo: "Westgate" }, bad, now)
    ).toBeNull()
  })
})
