// How often a person's answers can be re-embedded. Pure: the route reads and
// writes the stored times (in the user's app_metadata), this only decides.

export const MAX_EMBEDS_PER_HOUR = 5
export const EMBED_WINDOW_MS = 60 * 60 * 1000

export type EmbedLimit =
  | { allowed: true; recent: number[] }
  | { allowed: false; recent: number[]; retryAfterSeconds: number }

// `stored` is whatever was saved last time: normally ISO strings, but it
// comes from user metadata, so anything else is ignored rather than trusted.
export function checkEmbedLimit(stored: unknown, now: number): EmbedLimit {
  const recent = (Array.isArray(stored) ? stored : [])
    .map((t) => Date.parse(String(t)))
    .filter((t) => Number.isFinite(t) && t <= now && now - t < EMBED_WINDOW_MS)
    .sort((a, b) => a - b)

  if (recent.length < MAX_EMBEDS_PER_HOUR) return { allowed: true, recent }

  // The oldest of the last five has to age out before the next one is allowed.
  const oldest = recent[recent.length - MAX_EMBEDS_PER_HOUR]
  return {
    allowed: false,
    recent,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + EMBED_WINDOW_MS - now) / 1000)),
  }
}

// What to store after an embed: the recent times plus this one.
export function recordEmbed(recent: number[], now: number): string[] {
  return [...recent, now].slice(-MAX_EMBEDS_PER_HOUR).map((t) => new Date(t).toISOString())
}
