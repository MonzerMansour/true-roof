import { describe, expect, it } from "vitest"

import { looksLikeSpam } from "@/lib/listings/reviews"

describe("looksLikeSpam", () => {
  it("allows empty or normal comments", () => {
    expect(looksLikeSpam(null)).toBe(false)
    expect(looksLikeSpam("")).toBe(false)
    expect(looksLikeSpam("Staff were clear about curfew.")).toBe(false)
  })

  it("flags very short or repeated text and link overload", () => {
    expect(looksLikeSpam("ok")).toBe(true)
    expect(looksLikeSpam("spamspamspamspam")).toBe(true)
    expect(
      looksLikeSpam("See https://a.example and https://b.example please")
    ).toBe(true)
  })
})
