import { describe, expect, it } from "vitest"

import {
  cosineSimilarity,
  pairPhrases,
  splitSentences,
} from "@/lib/matching/phrase-similarity"

describe("splitSentences", () => {
  it("splits builder text into sentences", () => {
    expect(splitSentences("Household: Just me. Pet: No pet. Photo ID: Yes.")).toEqual([
      "Household: Just me.",
      "Pet: No pet.",
      "Photo ID: Yes.",
    ])
  })

  it("keeps a quote whole even with periods inside", () => {
    const text =
      'Vehicle: A car. Location and community preference, in their own words: "a few blocks from a park. on a quiet street.".'
    expect(splitSentences(text)).toEqual([
      "Vehicle: A car.",
      'Location and community preference, in their own words: "a few blocks from a park. on a quiet street.".',
    ])
  })

  it("splits lowercase sentences the site builder writes", () => {
    expect(splitSentences("Shelter: X, in San Jose. pets: any pet. couples: separate rooms.")).toHaveLength(3)
  })
})

describe("cosineSimilarity", () => {
  it("is 1 for the same direction and 0 for unrelated", () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1, 6)
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6)
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
  })
})

describe("pairPhrases", () => {
  it("pairs each phrase with its closest site phrase, highest first", () => {
    const pairs = pairPhrases(
      ["pet", "car"],
      [
        [1, 0],
        [0, 1],
      ],
      ["parking", "dogs ok"],
      [
        [0.1, 1],
        [1, 0.5],
      ]
    )
    expect(pairs.map((p) => [p.yours, p.theirs])).toEqual([
      ["car", "parking"],
      ["pet", "dogs ok"],
    ])
    expect(pairs[0].cosine).toBeGreaterThan(pairs[1].cosine)
  })

  it("returns nothing when the site has no text", () => {
    expect(pairPhrases(["pet"], [[1]], [], [])).toEqual([])
  })
})
