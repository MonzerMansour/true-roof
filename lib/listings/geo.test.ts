import { describe, expect, it } from "vitest"

import {
  cityCenters,
  defaultOrigin,
  milesBetween,
  usableCoordinate,
} from "@/lib/listings/geo"

describe("usableCoordinate", () => {
  it("rejects Null Island, including the near-zero values that caused this", () => {
    // The real row held 0.0002, -0.0005, so an exact === 0 test missed it.
    expect(usableCoordinate(0.0002, -0.0005)).toBeNull()
    expect(usableCoordinate(0.4, 0.4)).toBeNull()
    expect(usableCoordinate(-0.1, 0.2)).toBeNull()
    expect(usableCoordinate(0, 0)).toBeNull()
  })

  it("accepts a real coordinate, including a legitimate single zero", () => {
    expect(usableCoordinate(37.3382, -121.8863)).toEqual({
      lat: 37.3382,
      lng: -121.8863,
    })
    // Only the box around the origin is rejected. A zero on ONE axis is a
    // real place (the equator, or the prime meridian) and still passes.
    expect(usableCoordinate(0, -121.8863)).toEqual({ lat: 0, lng: -121.8863 })
    expect(usableCoordinate(37.3382, 0)).toEqual({ lat: 37.3382, lng: 0 })
  })

  it("rejects missing or half coordinates", () => {
    expect(usableCoordinate(null, null)).toBeNull()
    expect(usableCoordinate(37.3382, null)).toBeNull()
    expect(usableCoordinate(null, -121.8863)).toBeNull()
    expect(usableCoordinate(undefined, undefined)).toBeNull()
  })

  it("rejects values off the globe or not finite", () => {
    expect(usableCoordinate(91, 0)).toBeNull()
    expect(usableCoordinate(-91, 0)).toBeNull()
    expect(usableCoordinate(0, 181)).toBeNull()
    expect(usableCoordinate(0, -181)).toBeNull()
    expect(usableCoordinate(Number.NaN, -121)).toBeNull()
    expect(usableCoordinate(37, Number.POSITIVE_INFINITY)).toBeNull()
  })

  it("would have caught the 7934 mi row", () => {
    // Guard against a regression by asserting the symptom, not just the input.
    const bad = usableCoordinate(0, 0)
    expect(bad).toBeNull()

    const naive = { lat: 0, lng: 0 }
    expect(milesBetween(defaultOrigin, naive)).toBeGreaterThan(7000)
  })
})

describe("milesBetween", () => {
  it("measures a known county pair", () => {
    // San Jose to Santa Clara is roughly 4 miles.
    const miles = milesBetween(
      cityCenters["San Jose"],
      cityCenters["Santa Clara"]
    )
    expect(miles).toBeGreaterThan(2)
    expect(miles).toBeLessThan(7)
  })

  it("is zero for the same point and symmetric", () => {
    const a = cityCenters["San Jose"]
    const b = cityCenters["Gilroy"]
    expect(milesBetween(a, a)).toBeCloseTo(0, 6)
    expect(milesBetween(a, b)).toBeCloseTo(milesBetween(b, a), 6)
  })
})
