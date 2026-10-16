import { describe, expect, it } from "vitest"

import {
  A11Y_STORAGE_KEY,
  CONTRAST_ATTR,
  TEXT_SIZE_ATTR,
  a11yBootScript,
  contrastValues,
  defaultA11yPreferences,
  parseA11yPreferences,
  textScale,
  textSizeValues,
} from "@/lib/a11y/preferences"

describe("parseA11yPreferences", () => {
  it("round-trips a valid blob", () => {
    expect(parseA11yPreferences({ textSize: "larger", contrast: "high" })).toEqual({
      textSize: "larger",
      contrast: "high",
      voiceTyping: false,
    })
  })

  it("falls back to the default for anything it does not recognise", () => {
    // A stored preference that no longer exists must not leave someone stuck
    // with an attribute no CSS matches, which would silently look like the
    // setting does nothing.
    expect(parseA11yPreferences({ textSize: "huge", contrast: "high" })).toEqual({
      textSize: "normal",
      contrast: "high",
      voiceTyping: false,
    })
    expect(parseA11yPreferences(null)).toEqual(defaultA11yPreferences)
    expect(parseA11yPreferences("nonsense")).toEqual(defaultA11yPreferences)
    expect(parseA11yPreferences({})).toEqual(defaultA11yPreferences)
  })
})

describe("textScale", () => {
  it("covers every size and only ever grows", () => {
    expect(Object.keys(textScale).sort()).toEqual([...textSizeValues].sort())
    expect(textScale.normal).toBe(1)
    expect(textScale.large).toBeGreaterThan(textScale.normal)
    expect(textScale.larger).toBeGreaterThan(textScale.large)
  })
})

describe("a11yBootScript", () => {
  // It runs before React, before anything else, with no error boundary around
  // it. If it throws, the page is blank.
  it("never throws on bad or missing storage", () => {
    const cases: (string | null)[] = [
      null,
      "",
      "not json",
      '{"textSize":"huge"}',
      '{"textSize":"larger","contrast":"high"}',
      "[]",
    ]

    for (const stored of cases) {
      const attrs: Record<string, string> = {}
      const sandbox = {
        localStorage: { getItem: () => stored },
        document: {
          documentElement: {
            setAttribute: (k: string, v: string) => {
              attrs[k] = v
            },
          },
        },
      }
      const run = new Function("localStorage", "document", a11yBootScript)
      expect(
        () => run(sandbox.localStorage, sandbox.document),
        String(stored)
      ).not.toThrow()

      if (stored === '{"textSize":"larger","contrast":"high"}') {
        expect(attrs[TEXT_SIZE_ATTR]).toBe("larger")
        expect(attrs[CONTRAST_ATTR]).toBe("high")
      }
      if (stored === '{"textSize":"huge"}') {
        // Unknown value is ignored rather than written through.
        expect(attrs[TEXT_SIZE_ATTR]).toBeUndefined()
      }
    }
  })

  it("reads the same key and attributes the app writes", () => {
    expect(a11yBootScript).toContain(A11Y_STORAGE_KEY)
    expect(a11yBootScript).toContain(TEXT_SIZE_ATTR)
    expect(a11yBootScript).toContain(CONTRAST_ATTR)
    for (const value of [...textSizeValues, ...contrastValues]) {
      expect(a11yBootScript).toContain(value)
    }
  })
})

describe("voiceTyping", () => {
  it("is off unless it was saved as exactly true", () => {
    expect(parseA11yPreferences({}).voiceTyping).toBe(false)
    expect(parseA11yPreferences({ voiceTyping: "yes" }).voiceTyping).toBe(false)
    expect(parseA11yPreferences({ voiceTyping: true }).voiceTyping).toBe(true)
  })

  it("keeps the other settings when only voice typing is saved", () => {
    const parsed = parseA11yPreferences({ textSize: "large", voiceTyping: true })
    expect(parsed).toEqual({ textSize: "large", contrast: "normal", voiceTyping: true })
  })
})
