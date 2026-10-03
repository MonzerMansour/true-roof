import { describe, expect, it } from "vitest"

import { cityCenters, defaultOrigin } from "@/lib/listings/geo"
import { unknownCity } from "@/lib/listings/sources"
import type { Listing } from "@/lib/listings/types"
import {
  distancePoints,
  freshnessPoints,
  rankByDistanceAndFreshness,
  scoreListing,
} from "@/lib/matching/score"

const NOW = new Date("2026-09-27T12:00:00.000Z").getTime()
const HOUR = 60 * 60 * 1000

function listing(over: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    name: "A Shelter",
    kind: "shelter",
    freshness: "live",
    lastConfirmedAt: new Date(NOW - HOUR).toISOString(),
    pets: null,
    couples: null,
    parkingStatus: null,
    vehicleNote: null,
    city: "San Jose",
    orgName: "Org",
    orgDescription: null,
    address: null,
    lat: cityCenters["San Jose"].lat,
    lng: cityCenters["San Jose"].lng,
    phone: null,
    intakeMethod: "call",
    idRequired: null,
    curfewPolicy: null,
    curfewTime: null,
    intakeFrom: null,
    intakeTo: null,
    maxStay: null,
    petWeightLimitLbs: null,
    vehicleAllowed: null,
    vehicleMaxLengthFt: null,
    registrationRequired: null,
    projectType: null,
    totalBeds: null,
    dataSource: "provider_portal",
    sourceUrl: null,
    sourceAsOf: null,
    externalRating: null,
    externalRatingCount: null,
    externalRatingSource: null,
    ...over,
  }
}

describe("distancePoints", () => {
  it("rewards closer, on the same rungs the distance filter offers", () => {
    expect(distancePoints(0.5)).toBe(60)
    expect(distancePoints(2)).toBe(60)
    expect(distancePoints(4)).toBe(45)
    expect(distancePoints(9)).toBe(30)
    expect(distancePoints(19)).toBe(15)
    expect(distancePoints(40)).toBe(5)
  })

  it("gives an unknown distance nothing, so it sinks", () => {
    expect(distancePoints(null)).toBe(0)
  })
})

describe("freshnessPoints", () => {
  it("rewards a recent confirmation", () => {
    expect(
      freshnessPoints(new Date(NOW - HOUR).toISOString(), "live", NOW)
    ).toBe(40)
    expect(
      freshnessPoints(new Date(NOW - 6 * HOUR).toISOString(), "live", NOW)
    ).toBe(32)
  })

  it("caps by the staff badge, so a Call first row cannot look live", () => {
    expect(
      freshnessPoints(new Date(NOW - HOUR).toISOString(), "call_first", NOW)
    ).toBe(12)
    expect(
      freshnessPoints(new Date(NOW - HOUR).toISOString(), "recent", NOW)
    ).toBe(28)
  })

  it("scores a year-old county count at zero even if it claims to be live", () => {
    // Nothing in the app downgrades the freshness enum as time passes, so a row
    // set to Live in January still says Live. This is what stops the whole
    // imported inventory from outranking a genuinely live bed.
    const january = new Date("2025-01-22T00:00:00.000Z").toISOString()
    expect(freshnessPoints(january, "live", NOW)).toBe(0)
    expect(freshnessPoints(january, "call_first", NOW)).toBe(0)
  })

  it("does not reward a timestamp in the future", () => {
    expect(
      freshnessPoints(new Date(NOW + 5 * HOUR).toISOString(), "live", NOW)
    ).toBe(0)
  })

  it("survives an unparseable timestamp", () => {
    expect(freshnessPoints("not a date", "live", NOW)).toBe(0)
  })
})

describe("scoreListing", () => {
  it("discounts a city-level position against a known address", () => {
    // Rewarding a vague position equally would reward worse data.
    const exact = scoreListing(listing(), defaultOrigin, NOW)
    const cityOnly = scoreListing(
      listing({ lat: null, lng: null, city: "San Jose" }),
      defaultOrigin,
      NOW
    )
    expect(exact.basis).toBe("site")
    expect(cityOnly.basis).toBe("city")
    expect(cityOnly.distancePoints).toBeLessThan(exact.distancePoints)
  })

  it("cannot place a row whose city is unknown", () => {
    const placed = scoreListing(
      listing({ lat: null, lng: null, city: unknownCity }),
      defaultOrigin,
      NOW
    )
    expect(placed.basis).toBe("unknown")
    expect(placed.miles).toBeNull()
    expect(placed.distancePoints).toBe(0)
  })
})

describe("rankByDistanceAndFreshness", () => {
  it("puts a slightly farther fresh site above a near stale one", () => {
    // This is the behaviour lib/features.ts promises and the feed did not have:
    // it used to sort on distance alone, so the stale one won.
    const nearStale = listing({
      id: "near-stale",
      name: "Near but stale",
      lat: cityCenters["San Jose"].lat,
      lng: cityCenters["San Jose"].lng,
      freshness: "call_first",
      lastConfirmedAt: "2025-01-22T00:00:00.000Z",
    })
    const farFresh = listing({
      id: "far-fresh",
      name: "Farther but fresh",
      lat: cityCenters["Santa Clara"].lat,
      lng: cityCenters["Santa Clara"].lng,
      freshness: "live",
      lastConfirmedAt: new Date(NOW - HOUR).toISOString(),
    })

    const ranked = rankByDistanceAndFreshness(
      [nearStale, farFresh],
      defaultOrigin,
      { now: NOW }
    )
    expect(ranked[0].listing.id).toBe("far-fresh")
  })

  it("sinks rows it cannot place to the bottom", () => {
    const placed = listing({ id: "placed" })
    const unplaced = listing({
      id: "unplaced",
      lat: null,
      lng: null,
      city: unknownCity,
    })
    const ranked = rankByDistanceAndFreshness(
      [unplaced, placed],
      defaultOrigin,
      { now: NOW }
    )
    expect(ranked.map((r) => r.listing.id)).toEqual(["placed", "unplaced"])
  })

  it("keeps every listing, because ordering never excludes", () => {
    const input = [
      listing({ id: "a" }),
      listing({ id: "b" }),
      listing({ id: "c" }),
    ]
    expect(
      rankByDistanceAndFreshness(input, defaultOrigin, { now: NOW })
    ).toHaveLength(3)
  })

  it("is a total order, so reversing the input gives the same page", () => {
    const input = [
      listing({ id: "a", name: "Alpha" }),
      listing({ id: "b", name: "Bravo" }),
      listing({ id: "c", name: "Charlie" }),
    ]
    const forward = rankByDistanceAndFreshness(input, defaultOrigin, {
      now: NOW,
    })
    const backward = rankByDistanceAndFreshness(
      [...input].reverse(),
      defaultOrigin,
      {
        now: NOW,
      }
    )
    expect(forward.map((r) => r.listing.id)).toEqual(
      backward.map((r) => r.listing.id)
    )
  })

  it("breaks ties with the embedding order rather than discarding it", () => {
    const a = listing({ id: "a", name: "Alpha" })
    const b = listing({ id: "b", name: "Bravo" })
    // Identical scores, so only the embedding order separates them.
    const ranked = rankByDistanceAndFreshness([a, b], defaultOrigin, {
      now: NOW,
      embeddingRank: new Map([
        ["b", 0],
        ["a", 1],
      ]),
    })
    expect(ranked.map((r) => r.listing.id)).toEqual(["b", "a"])
  })
})
