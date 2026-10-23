// How full a site is. Staff publish two numbers, the most people the site can
// hold (total_beds) and how many are there now (current_people). Spots left is
// the difference, never a third number staff have to keep in step.
//
// Null on either side means the site has not published it, which is not the
// same as zero. A site with no numbers shows no count and no "Almost full".

/** At this many spots left or fewer, a site reads as almost full. */
export const ALMOST_FULL_AT = 5

export const MAX_PEOPLE_LIMIT = 10000

export type FillLevel = "full" | "almost_full"

export type CapacityInput = {
  totalBeds?: number | null
  currentPeople?: number | null
}

/** Spots left, or null when either number is missing. Never negative: a count
 * that has drifted past the maximum reads as full, not as minus three. */
export function spotsLeft(site: CapacityInput): number | null {
  const max = site.totalBeds
  const now = site.currentPeople
  if (typeof max !== "number" || typeof now !== "number") return null
  return Math.max(0, max - now)
}

/** "full" at none left, "almost_full" at ALMOST_FULL_AT or fewer, otherwise
 * null. Null also covers "not published", so callers show nothing rather than
 * guessing. */
export function fillLevel(site: CapacityInput): FillLevel | null {
  const left = spotsLeft(site)
  if (left === null) return null
  if (left === 0) return "full"
  return left <= ALMOST_FULL_AT ? "almost_full" : null
}

export const fillLevelLabel: Record<FillLevel, string> = {
  full: "Full",
  almost_full: "Almost full",
}

/** "1 spot left", "12 spots left", or null when it is not published. */
export function spotsLeftText(site: CapacityInput): string | null {
  const left = spotsLeft(site)
  if (left === null) return null
  return `${left} ${left === 1 ? "spot" : "spots"} left`
}

export type CapacityCheck =
  | { ok: true; max: number | null; current: number | null }
  | { ok: false; error: string }

function whole(raw: string): number | null {
  const text = raw.trim()
  if (!text) return null
  const value = Number(text)
  return Number.isInteger(value) ? value : Number.NaN
}

/**
 * Both numbers from a form, checked together.
 *
 * `required` is true when a site is being created or published: every new site
 * has to say how many people it can hold and how many are there. Otherwise
 * blank stays blank, so an imported site that has not published them can still
 * be edited without being forced to invent a count.
 */
export function checkCapacity(
  raw: { max: string; current: string },
  required: boolean
): CapacityCheck {
  const max = whole(raw.max)
  const current = whole(raw.current)

  if (Number.isNaN(max) || (max !== null && (max < 1 || max > MAX_PEOPLE_LIMIT))) {
    return {
      ok: false,
      error: `The most people the site can hold must be a whole number from 1 to ${MAX_PEOPLE_LIMIT.toLocaleString("en-US")}.`,
    }
  }
  if (
    Number.isNaN(current) ||
    (current !== null && (current < 0 || current > MAX_PEOPLE_LIMIT))
  ) {
    return {
      ok: false,
      error: `People there now must be a whole number from 0 to ${MAX_PEOPLE_LIMIT.toLocaleString("en-US")}.`,
    }
  }

  if (required && max === null) {
    return { ok: false, error: "Add the most people the site can hold." }
  }
  if (required && current === null) {
    return { ok: false, error: "Add how many people are there now." }
  }
  if (max !== null && current !== null && current > max) {
    return {
      ok: false,
      error: "People there now cannot be more than the most the site can hold.",
    }
  }
  // A count with no maximum has nothing to be measured against.
  if (max === null && current !== null) {
    return {
      ok: false,
      error: "Add the most people the site can hold, so the count means something.",
    }
  }

  return { ok: true, max, current }
}
