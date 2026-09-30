// Clock arithmetic for the matcher. Pure, no dates, no timezones.
//
// Everything is "HH:MM" on a 24 hour clock, which is what the questionnaire
// collects and what Postgres `time` columns normalize to.
//
// The case that matters: a window whose end is earlier than its start wraps
// past midnight. "Overnight use from 7pm to 7am" is 19:00 to 07:00, and a
// naive from <= t && t <= to test says nothing is ever open. Two of the real
// Mountain View lots are exactly this, so it is not a hypothetical.

const DAY = 24 * 60

/** Minutes since midnight, or null when the value is not a real HH:MM. */
export function minutesFromHHMM(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function isHHMM(value: unknown): value is string {
  return typeof value === "string" && minutesFromHHMM(value) !== null
}

/** A window as one or two non wrapping intervals in minutes. A window that
 * wraps midnight becomes [start, 1440) plus [0, end]. */
function intervals(from: number, to: number): [number, number][] {
  if (from <= to) return [[from, to]]
  return [
    [from, DAY - 1],
    [0, to],
  ]
}

/** Do the two windows share any minute? Either may wrap past midnight.
 *
 * Both ends are inclusive: a shelter taking people "until 20:00" and a person
 * who can arrive "from 20:00" do overlap, at 20:00. */
export function windowsOverlap(
  aFrom: string | null,
  aTo: string | null,
  bFrom: string | null,
  bTo: string | null
): boolean | null {
  const a1 = minutesFromHHMM(aFrom)
  const a2 = minutesFromHHMM(aTo)
  const b1 = minutesFromHHMM(bFrom)
  const b2 = minutesFromHHMM(bTo)

  // Unknown on either side is not a mismatch. The caller decides what to do.
  if (a1 == null || a2 == null || b1 == null || b2 == null) return null

  for (const [as, ae] of intervals(a1, a2)) {
    for (const [bs, be] of intervals(b1, b2)) {
      if (as <= be && bs <= ae) return true
    }
  }

  return false
}

/** Is `time` within the window? The window may wrap past midnight. */
export function timeWithinWindow(
  time: string | null,
  from: string | null,
  to: string | null
): boolean | null {
  const t = minutesFromHHMM(time)
  const f = minutesFromHHMM(from)
  const e = minutesFromHHMM(to)
  if (t == null || f == null || e == null) return null

  return intervals(f, e).some(([start, end]) => t >= start && t <= end)
}

/** Would someone who must get in by `latestEntry` miss a `curfew`?
 *
 * Both are "latest moment the door is useful", so this is a plain comparison,
 * with one wrinkle: the questionnaire offers "Midnight or later" as 00:00,
 * which is the END of the night, not the start. Treated as the latest possible
 * time rather than the earliest, or someone needing midnight entry would match
 * every curfew. */
export function missesCurfew(
  latestEntry: string | null,
  curfew: string | null
): boolean | null {
  const entry = minutesFromHHMM(latestEntry)
  const lock = minutesFromHHMM(curfew)
  if (entry == null || lock == null) return null

  const asNightTime = (minutes: number) =>
    minutes < 12 * 60 ? minutes + DAY : minutes

  return asNightTime(entry) > asNightTime(lock)
}
