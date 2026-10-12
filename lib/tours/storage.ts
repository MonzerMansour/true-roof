import type { TourId } from "./steps"

// Tour progress, per tour, on this device only.
//
// There is no server side to this and deliberately so: a tour is a property
// of a browser, not of a person. Somebody on a borrowed phone should get the
// tour offered on that phone, and somebody who has already been shown it on
// their own phone should not be shown it again just because they signed in
// somewhere new.

export type TourProgress = {
  /** Index into the filtered step list the person is currently on. */
  index: number
  /** They closed it. Never offered again on this device unless they replay. */
  dismissed: boolean
  /** They reached the last step. Also stops it being offered again. */
  completed: boolean
}

export const defaultTourProgress: TourProgress = {
  index: 0,
  dismissed: false,
  completed: false,
}

export function tourStorageKey(role: TourId) {
  return `true-roof:tour:${role}:v1`
}

/** A damaged or outdated entry must never stop a page rendering, so the shape
 * is checked rather than trusted. An index from a longer step list is clamped
 * by the caller, which is the only place that knows how many steps there are. */
export function parseTourProgress(raw: unknown): TourProgress {
  if (!raw || typeof raw !== "object") return defaultTourProgress
  const value = raw as Record<string, unknown>

  return {
    index:
      typeof value.index === "number" &&
      Number.isInteger(value.index) &&
      value.index >= 0
        ? value.index
        : 0,
    dismissed: value.dismissed === true,
    completed: value.completed === true,
  }
}

export function loadTourProgress(role: TourId): TourProgress {
  if (typeof window === "undefined") return defaultTourProgress

  try {
    const raw = window.localStorage.getItem(tourStorageKey(role))
    return raw ? parseTourProgress(JSON.parse(raw)) : defaultTourProgress
  } catch {
    return defaultTourProgress
  }
}

export function saveTourProgress(role: TourId, progress: TourProgress) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      tourStorageKey(role),
      JSON.stringify(progress)
    )
  } catch {
    // Storage blocked or full. The tour still works for this visit; it will
    // just be offered again next time, which is survivable.
  }
  window.dispatchEvent(new Event(TOUR_CHANGE_EVENT))
}

/** Fired after progress is written, so a Replay button elsewhere on the page
 * and the tour card itself stay in step without a reload. */
export const TOUR_CHANGE_EVENT = "true-roof:tour-change"

/** Starts the tour over and clears the dismissal, which is what the Replay
 * control in settings does. */
export function replayTour(role: TourId) {
  saveTourProgress(role, defaultTourProgress)
}

/** True when this device has neither finished nor dismissed this tour, which
 * is the only time it is offered unasked. */
export function shouldOfferTour(progress: TourProgress) {
  return !progress.dismissed && !progress.completed
}

/** The old single-card welcome on /places, which the tours replace.
 *
 * Its dismissal used to be carried over, so anybody who had closed that card
 * was never offered the seeker tour. That was wrong and it is why the seeker
 * tour appeared not to exist: the old card was two lines naming two ways in,
 * the tour is a walkthrough of nine pages, and closing the first is not a
 * decision about the second. The key is only cleared now, never read. */
export const LEGACY_TOUR_SEEN_KEY = "true-roof:tour-seen:v1"

export function clearLegacyTourSeen() {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(LEGACY_TOUR_SEEN_KEY)
  } catch {
    // Nothing to do. It is a key nothing reads.
  }
}
