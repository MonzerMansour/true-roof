import { describe, expect, it } from "vitest"

import {
  LEGACY_TOUR_SEEN_KEY,
  defaultTourProgress,
  parseTourProgress,
  shouldOfferTour,
  tourStorageKey,
} from "@/lib/tours/storage"

describe("parseTourProgress", () => {
  it("round-trips a valid blob", () => {
    expect(
      parseTourProgress({ index: 3, dismissed: false, completed: true })
    ).toEqual({ index: 3, dismissed: false, completed: true })
  })

  it("falls back rather than letting a bad entry break a page", () => {
    for (const bad of [null, "nonsense", 7, [], {}]) {
      expect(parseTourProgress(bad)).toEqual(defaultTourProgress)
    }
  })

  it("refuses an index that is not a usable step number", () => {
    // A negative or fractional index would index past the end of the step
    // array and render a blank card with working Next buttons.
    for (const index of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "2"]) {
      expect(parseTourProgress({ index }).index).toBe(0)
    }
  })

  it("treats anything but exactly true as not dismissed", () => {
    // Being wrong in this direction shows the tour again, which is annoying.
    // Being wrong the other way hides it forever with no way back.
    expect(parseTourProgress({ dismissed: "yes" }).dismissed).toBe(false)
    expect(parseTourProgress({ dismissed: 1 }).dismissed).toBe(false)
    expect(parseTourProgress({ dismissed: true }).dismissed).toBe(true)
  })
})

describe("shouldOfferTour", () => {
  it("offers only to someone who has neither finished nor closed it", () => {
    expect(shouldOfferTour(defaultTourProgress)).toBe(true)
    expect(shouldOfferTour({ ...defaultTourProgress, dismissed: true })).toBe(
      false
    )
    expect(shouldOfferTour({ ...defaultTourProgress, completed: true })).toBe(
      false
    )
    // Part way through, still offered, which is how it resumes.
    expect(shouldOfferTour({ index: 4, dismissed: false, completed: false })).toBe(
      true
    )
  })
})

describe("tourStorageKey", () => {
  it("keeps the two tours apart and follows the key convention", () => {
    expect(tourStorageKey("seeker")).toBe("true-roof:tour:seeker:v1")
    expect(tourStorageKey("provider")).toBe("true-roof:tour:provider:v1")
    expect(tourStorageKey("seeker")).not.toBe(tourStorageKey("provider"))
  })
})

describe("the old welcome card's key", () => {
  it("is not a tour id, so its dismissal can never stand in for one", () => {
    // Regression. Its dismissal used to be carried over onto the seeker tour,
    // which meant anybody who had used the app before was never offered the
    // tour at all: it looked like the seeker side simply did not have one.
    // The provider tour had no such key, which is why only that one appeared.
    for (const tour of ["seeker", "provider", "features"] as const) {
      expect(tourStorageKey(tour)).not.toBe(LEGACY_TOUR_SEEN_KEY)
    }
  })

  it("keeps its own name, so it can still be cleaned up", () => {
    expect(LEGACY_TOUR_SEEN_KEY).toBe("true-roof:tour-seen:v1")
  })
})

describe("tourStorageKey covers every tour", () => {
  it("gives all three their own entry", () => {
    const keys = (["seeker", "provider", "features"] as const).map(tourStorageKey)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
