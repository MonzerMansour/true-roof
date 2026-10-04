import { describe, expect, it } from "vitest"

import {
  FIELDS_WEIGHT,
  TEXT_LENIENCY_CEILING,
  TEXT_LENIENCY_FLOOR,
  TEXT_WEIGHT,
  formatPercent,
  hybridScore,
  lenientTextScore,
  roundUpPercent,
} from "@/lib/matching/score-blend"

describe("roundUpPercent", () => {
  it("rounds up, so a real match never undersells itself", () => {
    expect(roundUpPercent(0.001)).toBe(1)
    expect(roundUpPercent(0.5)).toBe(50)
    expect(roundUpPercent(0.501)).toBe(51)
  })

  it("shows 0% only for a true zero", () => {
    // The stated contract of Math.ceil here.
    expect(roundUpPercent(0)).toBe(0)
    expect(roundUpPercent(0.0001)).toBe(1)
  })

  it("clamps out-of-range input instead of printing 120%", () => {
    expect(roundUpPercent(1.5)).toBe(100)
    expect(roundUpPercent(-1)).toBe(0)
  })

  it("formats with a percent sign", () => {
    expect(formatPercent(0.42)).toBe("42%")
    expect(formatPercent(0)).toBe("0%")
  })
})

describe("lenientTextScore", () => {
  it("stretches the observed cosine band to the full range", () => {
    expect(lenientTextScore(TEXT_LENIENCY_FLOOR)).toBeCloseTo(0, 6)
    expect(lenientTextScore(TEXT_LENIENCY_CEILING)).toBeCloseTo(1, 6)
  })

  it("lifts the middle of the band above a straight line", () => {
    const mid = (TEXT_LENIENCY_FLOOR + TEXT_LENIENCY_CEILING) / 2
    expect(lenientTextScore(mid)).toBeGreaterThan(0.5)
  })

  it("reads the measured real scores leniently", () => {
    // Median and best of the 93 real sites against a real person's answers.
    expect(lenientTextScore(0.311)).toBeGreaterThan(0.6)
    expect(lenientTextScore(0.476)).toBe(1)
    // The weakest real site still reads as a partial match, not zero.
    expect(lenientTextScore(0.291)).toBeGreaterThan(0.5)
  })

  it("clamps outside the band rather than going negative or above 1", () => {
    // Cosine can fall below the floor; without clamping this would feed a
    // negative number into the blend and drag a score below zero.
    expect(lenientTextScore(0)).toBe(0)
    expect(lenientTextScore(-0.3)).toBe(0)
    expect(lenientTextScore(0.95)).toBe(1)
    expect(lenientTextScore(1)).toBe(1)
  })

  it("is monotonic: a better cosine never scores worse", () => {
    const steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1]
    const scores = steps.map(lenientTextScore)
    for (let i = 1; i < scores.length; i += 1) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
    }
  })
})

describe("hybridScore", () => {
  it("weights text above fields, as documented", () => {
    expect(TEXT_WEIGHT + FIELDS_WEIGHT).toBeCloseTo(1, 6)
    expect(TEXT_WEIGHT).toBeGreaterThan(FIELDS_WEIGHT)
  })

  it("stays within 0 and 1 across the whole input space", () => {
    for (const cosine of [-1, 0, 0.2, 0.4, 0.6, 1]) {
      for (const categorical of [0, 0.5, 1]) {
        const score = hybridScore(cosine, categorical)
        expect(
          score,
          `cosine ${cosine}, categorical ${categorical}`
        ).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      }
    }
  })

  it("reaches both ends", () => {
    expect(hybridScore(TEXT_LENIENCY_CEILING, 1)).toBeCloseTo(1, 6)
    expect(hybridScore(TEXT_LENIENCY_FLOOR, 0)).toBeCloseTo(0, 6)
  })

  it("lets text move the result when fields are tied", () => {
    // The stated reason for the 65/35 split: categorical saturates, so text
    // has to carry the separation.
    const weak = hybridScore(0.25, 0.5)
    const strong = hybridScore(0.55, 0.5)
    expect(strong).toBeGreaterThan(weak)
  })
})
