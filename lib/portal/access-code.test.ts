import { describe, expect, it } from "vitest"

import {
  ACCESS_CODE_MIN,
  accessCodeProblem,
  looksGuessable,
  normalizeAccessCode,
} from "@/lib/portal/access-code"

describe("accessCodeProblem", () => {
  it("accepts a plain letters-and-numbers code", () => {
    expect(accessCodeProblem("AB2CD3EF")).toBeNull()
  })

  it("says nothing about an empty box, which just means generate one", () => {
    expect(accessCodeProblem("")).toBeNull()
    expect(accessCodeProblem("   ")).toBeNull()
  })

  it("refuses a code too short to be worth having", () => {
    expect(accessCodeProblem("AB2")).toContain(String(ACCESS_CODE_MIN))
  })

  it("refuses punctuation, which does not survive being read aloud", () => {
    expect(accessCodeProblem("AB-2CD-3")).toContain("letters and numbers")
  })

  it("ignores spaces and case, the way somebody types a code off paper", () => {
    expect(normalizeAccessCode(" ab2 cd3e ")).toBe("AB2CD3E")
    expect(accessCodeProblem(" ab2 cd3e ")).toBeNull()
  })
})

describe("looksGuessable", () => {
  it("flags the codes somebody would try first", () => {
    // This code is the only thing between a stranger and editing what a
    // shelter says about its beds.
    for (const code of ["SHELTER1", "12345678", "AAAAAAAA", "trueroof"]) {
      expect(looksGuessable(code), code).toBe(true)
    }
  })

  it("leaves a random code alone", () => {
    for (const code of ["AB2CD3EF", "K7MNP4QR"]) {
      expect(looksGuessable(code), code).toBe(false)
    }
  })

  it("says nothing about an empty box", () => {
    expect(looksGuessable("")).toBe(false)
  })
})
