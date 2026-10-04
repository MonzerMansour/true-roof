import type { Listing } from "@/lib/listings/types"
import { listingFitsNeeds, type FitResult } from "@/lib/matching/hard-filters"
import type { SeekerNeeds } from "@/lib/matching/needs"

export type HouseholdSplit = {
  yours: Listing
  partner: Listing
  yoursFit: FitResult
  partnerFit: FitResult
}

function aloneNeeds(needs: SeekerNeeds): SeekerNeeds {
  return {
    ...needs,
    household: "alone",
    partnerRooms: null,
  }
}

/** True when the only published hard miss is that this site does not take
 * the couple together. Other misses still hide the row. */
export function couplesOnlyMiss(fit: FitResult): boolean {
  if (fit.fits) return false
  if (fit.reasons.length === 0) return false
  return fit.reasons.every(
    (reason) =>
      reason === "This site does not take couples." ||
      reason === "This site only has separate rooms for partners." ||
      reason === "This site only has a shared room for partners."
  )
}

function milesBetween(a: Listing, b: Listing): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
    return null
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 3958.8 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function pairScore(a: Listing, b: Listing): number {
  const miles = milesBetween(a, b)
  if (miles == null) return 40
  return Math.max(0, 100 - miles * 8)
}

/**
 * When no one listing can take the whole household, pick two sites that each
 * take one person. Only for a couple. Unpublished couple policy still keeps
 * the original row. This does not score or invent a fifth matcher file: it
 * reuses listingFitsNeeds.
 */
export function suggestHouseholdSplit(
  listings: Listing[],
  needs: SeekerNeeds | null
): HouseholdSplit | null {
  if (!needs || needs.household !== "with_partner") return null

  const wholeFits = listings.some((listing) => {
    const fit = listingFitsNeeds(listing, needs)
    return fit.fits
  })
  if (wholeFits) return null

  const solo = aloneNeeds(needs)
  const soloFits = listings.filter((listing) => {
    const asCouple = listingFitsNeeds(listing, needs)
    if (!couplesOnlyMiss(asCouple) && !asCouple.fits) {
      return false
    }
    return listingFitsNeeds(listing, solo).fits
  })

  if (soloFits.length < 2) return null

  let best: HouseholdSplit | null = null
  let bestScore = -1

  for (let i = 0; i < soloFits.length; i += 1) {
    for (let j = i + 1; j < soloFits.length; j += 1) {
      const yours = soloFits[i]!
      const partner = soloFits[j]!
      const score = pairScore(yours, partner)
      if (score <= bestScore) continue
      bestScore = score
      best = {
        yours,
        partner,
        yoursFit: listingFitsNeeds(yours, solo),
        partnerFit: listingFitsNeeds(partner, solo),
      }
    }
  }

  return best
}
