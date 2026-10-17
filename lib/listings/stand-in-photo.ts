import {
  sitePhotos,
  type SitePhoto,
  type SitePhotoCategory,
} from "@/lib/listings/site-photos"
import type { Listing } from "@/lib/listings/types"

/**
 * Which stand-in photograph a site gets, and why that one.
 *
 * The pools are chosen from what the record actually says, so the picture is
 * at least the right kind of place. An emergency shelter can draw on
 * apartment blocks and row houses, both of which a large shelter in California
 * is often a converted version of. Transitional housing draws on row houses
 * and single homes. A lot is drawn with the largest vehicle it actually takes,
 * because that is what somebody sleeping in an RV is scanning the list for.
 *
 * Where the record says nothing the pool claims nothing: a lot that has not
 * published what it takes gets the plain car lot, never the RV one, the same
 * way a null policy never excludes a listing anywhere else in this app.
 *
 * The pools overlap on purpose and it costs something. A terrace suits both a
 * converted emergency shelter and transitional housing, so those photographs
 * are drawn from twice as often and the most-reused one is the face of six
 * sites out of a hundred and eleven. Before this there were four shelter
 * photographs in total and the most-reused was the face of twenty-eight, so
 * the overlap is worth it; the number is in the test so it cannot drift
 * without somebody noticing.
 */

type PoolChoice = { pools: SitePhotoCategory[]; description: string }

/** Only the fields that decide which picture a site gets. */
export type StandInSubject = Pick<
  Listing,
  "id" | "name" | "kind" | "vehicleAllowed" | "projectType"
>

function poolsFor(listing: StandInSubject): PoolChoice {
  if (listing.kind === "parking") {
    if (listing.vehicleAllowed === "car_van_rv") {
      return { pools: ["lot_rv"], description: "a lot with a motorhome in it" }
    }
    if (listing.vehicleAllowed === "car_van") {
      return { pools: ["lot_van"], description: "a lot with a van in it" }
    }
    return { pools: ["lot_car"], description: "a parking lot" }
  }

  switch (listing.projectType) {
    case "emergency_shelter":
      return {
        pools: ["block", "terrace"],
        description: "an apartment building",
      }
    case "transitional_housing":
      return {
        pools: ["terrace", "house"],
        description: "houses on a street",
      }
    case "safe_haven":
      return { pools: ["house"], description: "a house" }
    default:
      // HUD publishes no project type for some rows. Row houses and single
      // homes are the quietest thing to show: neither implies a dormitory.
      return { pools: ["terrace", "house"], description: "houses on a street" }
  }
}

/** FNV-1a. A sum of character codes was fine when there were four pictures,
 * but across pools of twenty-odd it left visible clumping, so this one needs
 * a real avalanche. */
function hash(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type StandInPhoto = SitePhoto & {
  /** What it is a picture of, for the alt text and the screen reader line. */
  description: string
}

export function standInPhotoFor(listing: StandInSubject): StandInPhoto {
  const { pools, description } = poolsFor(listing)
  const all = pools.flatMap((pool) => sitePhotos[pool])
  const photo = all[hash(listing.id) % all.length]

  return { ...photo, description }
}

/** How many pictures a site of this kind is drawn from. Used by the tests to
 * assert the pools are big enough to be worth having. */
export function standInPoolSizeFor(listing: StandInSubject) {
  return poolsFor(listing).pools.reduce(
    (sum, pool) => sum + sitePhotos[pool].length,
    0
  )
}
