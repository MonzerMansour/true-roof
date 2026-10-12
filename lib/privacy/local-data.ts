// What "remove my information from this phone" actually removes.
//
// One list, in one place, because the alternative is a clear function that
// quietly falls behind every time a feature adds a key. Somebody on a
// borrowed phone is told their information is gone; a key this list forgot
// is that promise being untrue.
//
// Split into two groups, because the two cannot be offered on the same terms.

/** Written to this phone and also to the person's account. Removing the local
 * copy loses nothing: it comes back when they sign in again. */
export const ACCOUNT_BACKED_KEYS = [
  "true-roof:seeker-needs:v1",
  "true-roof:seeker-needs-draft:v1",
] as const

/** This phone is the only copy. There is no table for any of these, no API
 * route writes them, and nothing is queued to sync. Removing them cannot be
 * undone, which the dialog has to say out loud. */
export const DEVICE_ONLY_KEYS = [
  "true-roof:obligations:v1",
  "true-roof:payments:v1",
  "true-roof:completed-occurrences:v1",
  "true-roof:deadlines-reset",
  "true-roof:favorites:v1",
  "true-roof:recent-places:v1",
  "true-roof:place-filters:v1",
] as const

/**
 * Settings for the phone rather than facts about the person, so signing out
 * leaves them alone.
 *
 * Clearing the accessibility preferences would be actively harmful: the next
 * person to pick up a shared phone is most likely the same person signing
 * back in, and resetting their text size to normal hands them an app they
 * cannot read as the result of signing out.
 */
export const KEPT_ON_SIGN_OUT = [
  "true-roof:a11y:v1",
  "true-roof:tour:seeker:v1",
  "true-roof:tour:provider:v1",
  "true-roof:tour:features:v1",
  "true-roof:developer-mode",
] as const

export const REMOVABLE_KEYS = [
  ...ACCOUNT_BACKED_KEYS,
  ...DEVICE_ONLY_KEYS,
] as const

/** Removes everything the sign-out dialog offers to remove.
 *
 * Never throws. This runs on the way out of the app, and a storage error must
 * not be able to leave somebody stuck signed in on a phone they are handing
 * back.
 */
export function removeLocalData() {
  if (typeof window === "undefined") return

  for (const key of REMOVABLE_KEYS) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Blocked or full. Keep going: the remaining keys still come out.
    }
  }
}

/** True when this phone is holding anything the dialog would remove. Lets
 * sign-out skip the question entirely when there is nothing to decide. */
export function hasLocalData() {
  if (typeof window === "undefined") return false

  return REMOVABLE_KEYS.some((key) => {
    try {
      return window.localStorage.getItem(key) !== null
    } catch {
      return false
    }
  })
}
