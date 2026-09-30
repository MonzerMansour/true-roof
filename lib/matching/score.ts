// The ordering half of the one matcher.
//
//   lib/matching/hard-filters.ts  decides what is removed
//   lib/matching/score.ts         decides the order of what survived
//   lib/matching/rank.ts          asks the database for embedding order
//
// Do not add a fourth file, and do not exclude anything here.
//
// This file is pure and isomorphic: types plus milesBetween, no React, no
// next/headers, no Supabase. The feed runs it on the client because the origin
// comes from browser geolocation.
//
// lib/features.ts has always promised results "sorted by distance and how fresh
// the information is". Until this existed, the feed sorted by distance alone and
// threw away the embedding order it was handed.

import {
  listingPoint,
  milesBetween,
  type DistanceBasis,
  type GeoPoint,
} from "@/lib/listings/geo"
import type { Freshness, Listing } from "@/lib/listings/types"

export type RankScore = {
  /** 0 to 100. Higher is better. */
  score: number
  distancePoints: number
  freshnessPoints: number
  miles: number | null
  basis: DistanceBasis
}

const HOUR = 60 * 60 * 1000

/** Distance, 60 of 100 points.
 *
 * Rungs, not a curve, and deliberately the same rungs the distance filter
 * offers, so the order and the filter tell one story. Everything inside 2 miles
 * ties, which means freshness decides between them. For someone on foot that is
 * right: anything that close is close enough, so show the one most likely to
 * still have a bed. */
export function distancePoints(miles: number | null): number {
  if (miles == null) return 0
  if (miles <= 2) return 60
  if (miles <= 5) return 45
  if (miles <= 10) return 30
  if (miles <= 20) return 15
  return 5
}

/** Freshness, 40 of 100 points.
 *
 * The timestamp is trusted and the staff badge is only a ceiling. Nothing in the
 * app ever downgrades `freshness` as time passes, so a row set to Live in
 * January still claims Live in September. Capping means a stale row cannot
 * outrank a genuinely live bed no matter what its badge says.
 *
 * Every HUD sourced row is a January 2025 count, so it scores 0 here. That is
 * the point: real availability outranks a year old inventory list. */
export function freshnessPoints(
  lastConfirmedAt: string,
  freshness: Freshness,
  now = Date.now()
): number {
  const cap = { live: 40, recent: 28, call_first: 12 }[freshness]
  const age = now - new Date(lastConfirmedAt).getTime()

  let byAge: number
  if (!Number.isFinite(age) || age < 0) byAge = 0
  else if (age <= 2 * HOUR) byAge = 40
  else if (age <= 12 * HOUR) byAge = 32
  else if (age <= 24 * HOUR) byAge = 24
  else if (age <= 72 * HOUR) byAge = 12
  else if (age <= 14 * 24 * HOUR) byAge = 4
  else byAge = 0

  return Math.min(cap, byAge)
}

export function scoreListing(
  listing: Listing,
  origin: GeoPoint,
  now = Date.now()
): RankScore {
  const { point, basis } = listingPoint(listing)
  const miles = point ? milesBetween(origin, point) : null

  // A city level position is a real signal but a weak one, so it earns three
  // quarters of what a street level position would. Without this a site we can
  // only place to the nearest city could outrank one whose exact address we
  // know, which would reward worse data.
  const raw = distancePoints(miles)
  const distance = basis === "city" ? Math.round(raw * 0.75) : raw
  const fresh = freshnessPoints(listing.lastConfirmedAt, listing.freshness, now)

  return {
    score: distance + fresh,
    distancePoints: distance,
    freshnessPoints: fresh,
    miles,
    basis,
  }
}

export type RankedListing<T extends Listing = Listing> = {
  listing: T
  rank: RankScore
}

/** Closest and freshest first.
 *
 * Ties break by the embedding order the server already computed, then by name,
 * then by id, so the result is a total order and the same input always produces
 * the same page. `embeddingRank` maps a listing id to its index in the order
 * lib/matching/rank.ts returned. Before this, the feed discarded that order
 * entirely while still showing a badge claiming it had been used. */
export function rankByDistanceAndFreshness<T extends Listing>(
  listings: T[],
  origin: GeoPoint,
  options: { now?: number; embeddingRank?: Map<string, number> } = {}
): RankedListing<T>[] {
  const { now = Date.now(), embeddingRank } = options

  return listings
    .map((listing) => ({ listing, rank: scoreListing(listing, origin, now) }))
    .sort((a, b) => {
      if (b.rank.score !== a.rank.score) return b.rank.score - a.rank.score

      if (embeddingRank) {
        const ai = embeddingRank.get(a.listing.id) ?? Number.MAX_SAFE_INTEGER
        const bi = embeddingRank.get(b.listing.id) ?? Number.MAX_SAFE_INTEGER
        if (ai !== bi) return ai - bi
      }

      const byName = a.listing.name.localeCompare(b.listing.name)
      if (byName !== 0) return byName
      return a.listing.id.localeCompare(b.listing.id)
    })
}
