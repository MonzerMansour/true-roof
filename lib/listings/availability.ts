import type { ParkingStatus, SiteKind } from "@/lib/listings/types"

// Two things about how many people a site can take.
//
// The most people it can hold is the existing total_beds column. Staff give it
// when they make a site and have to give it to publish one.
//
// "Always full" is a switch staff can turn on for a shelter that has no room
// and wants people to know before they come. It is stored in the existing
// parking_status column, as "full". That column is named for lots, but its
// values (open, full, waitlist) just say whether there is room, so a shelter
// can use the same one without a migration. Lots do not need the switch: their
// Availability field already says full.

/** What the "always full" switch writes to parking_status. */
export const ALWAYS_FULL_STATUS: ParkingStatus = "full"

export const MAX_PEOPLE_LIMIT = 10000

/** True for a shelter staff have marked always full. A lot that is full says so
 * through its own status badge, so this is shelters only. */
export function isAlwaysFull(site: {
  kind: SiteKind
  parkingStatus?: ParkingStatus | null
}): boolean {
  return site.kind === "shelter" && site.parkingStatus === ALWAYS_FULL_STATUS
}

export type MaxPeopleCheck =
  | { ok: true; max: number | null }
  | { ok: false; error: string }

/**
 * The most-people number from a form.
 *
 * `required` is true when a site is created or published: every new site has to
 * say how many people it can hold. Otherwise blank stays blank, so an imported
 * site that has not published one can still be edited without being forced to
 * invent a number.
 */
export function checkMaxPeople(raw: string, required: boolean): MaxPeopleCheck {
  const text = raw.trim()

  if (!text) {
    return required
      ? { ok: false, error: "Add the most people the site can hold." }
      : { ok: true, max: null }
  }

  const value = Number(text)
  if (!Number.isInteger(value) || value < 1 || value > MAX_PEOPLE_LIMIT) {
    return {
      ok: false,
      error: `The most people the site can hold must be a whole number from 1 to ${MAX_PEOPLE_LIMIT.toLocaleString("en-US")}.`,
    }
  }

  return { ok: true, max: value }
}
