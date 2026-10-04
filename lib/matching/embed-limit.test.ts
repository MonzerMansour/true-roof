import { describe, expect, it } from "vitest"

import { checkEmbedLimit, recordEmbed } from "@/lib/matching/embed-limit"

const NOW = Date.parse("2026-10-03T12:00:00.000Z")
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()

describe("checkEmbedLimit", () => {
  it("allows the first update", () => {
    expect(checkEmbedLimit(undefined, NOW).allowed).toBe(true)
  })

  it("allows a fifth update in the hour", () => {
    expect(checkEmbedLimit([1, 2, 3, 4].map(minutesAgo), NOW).allowed).toBe(true)
  })

  it("blocks a sixth and says when the next one is allowed", () => {
    const result = checkEmbedLimit([50, 40, 30, 20, 10].map(minutesAgo), NOW)
    expect(result.allowed).toBe(false)
    // The update from 50 minutes ago ages out in 10 minutes.
    if (!result.allowed) expect(result.retryAfterSeconds).toBe(600)
  })

  it("forgets updates older than an hour", () => {
    const result = checkEmbedLimit([90, 70, 61, 5].map(minutesAgo), NOW)
    expect(result.allowed).toBe(true)
    expect(result.recent).toHaveLength(1)
  })

  it("ignores junk and future times instead of trusting them", () => {
    const stored = ["not a date", null, 42, new Date(NOW + 60_000).toISOString(), minutesAgo(1)]
    expect(checkEmbedLimit(stored, NOW).recent).toHaveLength(1)
    expect(checkEmbedLimit("oops", NOW).allowed).toBe(true)
  })
})

describe("recordEmbed", () => {
  it("adds this update and keeps at most five", () => {
    const recent = [5, 4, 3, 2, 1].map((m) => NOW - m * 60_000)
    const stored = recordEmbed(recent, NOW)
    expect(stored).toHaveLength(5)
    expect(stored.at(-1)).toBe(new Date(NOW).toISOString())
  })
})
