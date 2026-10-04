import { describe, expect, it } from "vitest"

import {
  checkDeadline,
  sentenceMentionsDate,
  type DeadlineDraft,
} from "@/lib/obligations/deadline-rules"

const TODAY = "2026-10-03"

const calfresh: DeadlineDraft = {
  title: "Send CalFresh report",
  category: "benefit_paperwork",
  program: "calfresh",
  firstDueDate: "2026-10-15",
  repeat: { every: 6, unit: "month" },
  whatToBring: "Last 2 pay stubs",
}

describe("checkDeadline: program rules override the reader", () => {
  it("accepts a correct CalFresh report as is", () => {
    const result = checkDeadline(calfresh, TODAY)
    expect(result.problems).toEqual([])
    expect(result.notes).toEqual([])
    expect(result.draft.repeat).toEqual({ every: 6, unit: "month" })
  })

  it("fixes a CalFresh report the reader said was monthly", () => {
    const result = checkDeadline({ ...calfresh, repeat: { every: 1, unit: "month" } }, TODAY)
    expect(result.draft.repeat).toEqual({ every: 6, unit: "month" })
    expect(result.notes[0]).toMatch(/every 6 months, not every month/)
  })

  it("makes a one-time CalFresh report repeat", () => {
    const result = checkDeadline({ ...calfresh, repeat: null }, TODAY)
    expect(result.draft.repeat).toEqual({ every: 6, unit: "month" })
  })

  it("treats every year and every 12 months as the same for a voucher review", () => {
    const result = checkDeadline(
      { ...calfresh, program: "housing_voucher", repeat: { every: 1, unit: "year" } },
      TODAY
    )
    expect(result.notes).toEqual([])
    expect(result.draft.repeat).toEqual({ every: 1, unit: "year" })
  })

  it("leaves rent every 2 weeks alone, because some people really pay that way", () => {
    const result = checkDeadline(
      { ...calfresh, title: "Pay rent", category: "rent", program: null, repeat: { every: 2, unit: "week" } },
      TODAY
    )
    expect(result.draft.repeat).toEqual({ every: 2, unit: "week" })
    expect(result.notes).toEqual([])
  })

  it("drops a program from anything that is not benefit paperwork", () => {
    const result = checkDeadline({ ...calfresh, category: "appointment" }, TODAY)
    expect(result.draft.program).toBeNull()
  })
})

describe("checkDeadline: it never guesses a date", () => {
  it("blanks a date the reader made up when the sentence had none", () => {
    const result = checkDeadline(calfresh, TODAY, "calfresh report")
    expect(result.draft.firstDueDate).toBeNull()
    expect(result.problems).toContain("Pick the date it is due. We do not guess dates.")
  })

  it("keeps the date when the sentence said one", () => {
    const result = checkDeadline(calfresh, TODAY, "calfresh report due the 15th")
    expect(result.draft.firstDueDate).toBe("2026-10-15")
    expect(result.problems).toEqual([])
  })

  it("rejects a date that does not exist", () => {
    const result = checkDeadline({ ...calfresh, firstDueDate: "2027-02-30" }, TODAY)
    expect(result.problems).toContain("That date does not exist. Pick it again.")
  })

  it("flags a likely wrong year", () => {
    expect(checkDeadline({ ...calfresh, firstDueDate: "2036-10-15" }, TODAY).problems[0]).toMatch(
      /more than 2 years away/
    )
    expect(checkDeadline({ ...calfresh, firstDueDate: "2016-10-15" }, TODAY).problems[0]).toMatch(
      /more than a year ago/
    )
  })

  it("needs a title", () => {
    expect(checkDeadline({ ...calfresh, title: "  " }, TODAY).problems).toContain(
      "Add what this deadline is for."
    )
  })
})

describe("sentenceMentionsDate", () => {
  it("hears dates said many ways", () => {
    for (const s of ["due the 15th", "rent on the first", "by Friday", "due tomorrow", "next month", "Oct 15"]) {
      expect(sentenceMentionsDate(s)).toBe(true)
    }
  })

  it("hears no date when there is none", () => {
    expect(sentenceMentionsDate("calfresh report, bring pay stubs")).toBe(false)
  })
})

describe("checkDeadline: due time", () => {
  it("keeps a real time", () => {
    const result = checkDeadline({ ...calfresh, dueTime: "17:00" }, TODAY)
    expect(result.draft.dueTime).toBe("17:00")
    expect(result.problems).toEqual([])
  })

  it("rejects a time that does not exist", () => {
    const result = checkDeadline({ ...calfresh, dueTime: "25:00" }, TODAY)
    expect(result.draft.dueTime).toBeNull()
    expect(result.problems[0]).toMatch(/time does not look right/)
  })

  it("is fine with no time", () => {
    expect(checkDeadline({ ...calfresh, dueTime: null }, TODAY).problems).toEqual([])
  })
})
