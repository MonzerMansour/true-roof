// What happened when a site was put into matching. Pure, so the portal can
// turn it into words and the words can be tested without a database.

export type EmbedOutcome = "embedded" | "unchanged" | "skipped" | "failed"

/** What staff are told when the site was saved but not (re)added to matching.
 * Null when matching is up to date, which includes "unchanged": the text did
 * not change, so the stored embedding is already right. */
export function matchingWarning(outcome: EmbedOutcome): string | null {
  if (outcome === "embedded" || outcome === "unchanged") return null
  return "Saved, but the site could not be added to matching yet. Save it again in a minute."
}
