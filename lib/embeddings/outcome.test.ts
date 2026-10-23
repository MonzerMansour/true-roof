import { describe, expect, it } from "vitest"

import { matchingWarning } from "@/lib/embeddings/outcome"

describe("matchingWarning", () => {
  it("says nothing when the site is in matching", () => {
    expect(matchingWarning("embedded")).toBeNull()
    expect(matchingWarning("unchanged")).toBeNull()
  })

  it("warns when the embedding failed or was never attempted", () => {
    expect(matchingWarning("failed")).toMatch(/could not be added to matching/)
    expect(matchingWarning("skipped")).toMatch(/could not be added to matching/)
  })
})
