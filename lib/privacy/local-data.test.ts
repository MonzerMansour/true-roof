import { describe, expect, it } from "vitest"

import {
  ACCOUNT_BACKED_KEYS,
  DEVICE_ONLY_KEYS,
  KEPT_ON_SIGN_OUT,
  REMOVABLE_KEYS,
} from "@/lib/privacy/local-data"

describe("what sign-out offers to remove", () => {
  it("never lists the same key in two groups", () => {
    // A key in both groups would be described to the person as both "saved to
    // your account as well" and "cannot be undone", one of which is a lie.
    const all = [...ACCOUNT_BACKED_KEYS, ...DEVICE_ONLY_KEYS, ...KEPT_ON_SIGN_OUT]
    expect(new Set(all).size).toBe(all.length)
  })

  it("removes exactly the two groups it describes", () => {
    expect([...REMOVABLE_KEYS].sort()).toEqual(
      [...ACCOUNT_BACKED_KEYS, ...DEVICE_ONLY_KEYS].sort()
    )
  })

  it("keeps the accessibility setting", () => {
    // Resetting somebody's text size to normal as a side effect of signing
    // out hands them back an app they cannot read.
    expect(KEPT_ON_SIGN_OUT).toContain("true-roof:a11y:v1")
    expect(REMOVABLE_KEYS).not.toContain("true-roof:a11y:v1")
  })

  it("only removes answers that the account also holds", () => {
    // Everything in the account-backed group must really be written server
    // side by /api/needs/embed, or "removing them here loses nothing" is
    // false. Those are the questionnaire answers and their draft, nothing
    // else.
    expect([...ACCOUNT_BACKED_KEYS]).toEqual([
      "true-roof:seeker-needs:v1",
      "true-roof:seeker-needs-draft:v1",
    ])
  })

  it("follows the storage key convention, so a typo cannot silently miss", () => {
    for (const key of [...REMOVABLE_KEYS, ...KEPT_ON_SIGN_OUT]) {
      expect(key, key).toMatch(/^true-roof:/)
    }
  })
})

describe("the list keeps up with the app", () => {
  it("covers every key the storage modules write", async () => {
    // The point of failure this guards is a new feature adding a
    // true-roof:* key and nobody adding it here, which would leave that
    // information on a phone after somebody was told it had been removed.
    const sources = await Promise.all(
      [
        "../matching/storage",
        "../obligations/storage",
        "../obligations/alert-email",
        "../listings/activity",
        "../listings/place-filters",
      ].map(async (path) => {
        const url = new URL(`${path}.ts`, import.meta.url)
        const { readFileSync } = await import("node:fs")
        return readFileSync(url, "utf8")
      })
    )

    const written = new Set(
      sources
        .flatMap((source) => source.match(/"true-roof:[^"]+"/g) ?? [])
        .map((quoted) => quoted.slice(1, -1))
    )

    const accounted = new Set<string>([...REMOVABLE_KEYS, ...KEPT_ON_SIGN_OUT])
    const missing = [...written].filter((key) => !accounted.has(key))

    expect(
      missing,
      `these keys are written but not in lib/privacy/local-data.ts: ${missing.join(", ")}`
    ).toEqual([])
  })
})
