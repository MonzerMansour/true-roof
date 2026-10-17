/** Site access codes, as the form sees them.
 *
 * Mirrors the checks in set_listing_access_code so somebody typing one gets
 * told immediately rather than after a round trip. The database still
 * enforces it: this is for the person, not for safety.
 */

export const ACCESS_CODE_MIN = 6
export const ACCESS_CODE_MAX = 16

/** No I, O, 0 or 1. These get read down a phone and written on paper. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateAccessCode(length = 8): string {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (n) => ALPHABET[n % ALPHABET.length]).join("")
}

export function normalizeAccessCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase()
}

/** The reason a code is not usable, or null when it is. */
export function accessCodeProblem(raw: string): string | null {
  const code = normalizeAccessCode(raw)

  if (code.length === 0) return null
  if (code.length < ACCESS_CODE_MIN) {
    return `A code needs at least ${ACCESS_CODE_MIN} characters.`
  }
  if (code.length > ACCESS_CODE_MAX) {
    return `A code can be at most ${ACCESS_CODE_MAX} characters.`
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return "A code can only use letters and numbers."
  }
  return null
}

/** True for codes anybody could guess. Not refused, because a site may have a
 * reason, but worth saying out loud: this code is what stops a stranger
 * editing what a shelter tells people about its beds. */
export function looksGuessable(raw: string): boolean {
  const code = normalizeAccessCode(raw)
  if (code.length === 0) return false

  const words = ["SHELTER", "PARKING", "TRUEROOF", "PASSWORD", "ADMIN", "TEST"]
  if (words.some((word) => code.includes(word))) return true
  // All one character, or a plain run of digits like 12345678.
  if (/^(.)\1+$/.test(code)) return true
  if (/^[0-9]+$/.test(code)) return true
  return false
}
