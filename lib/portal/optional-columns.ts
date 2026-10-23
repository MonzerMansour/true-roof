// Saving a site when the database may not have run every migration yet.
//
// Some columns arrived in later migrations (description, so far).
// PostgREST rejects a whole write that names a column it does not know, and it
// names only one missing column per rejection. So a save that includes several
// optional columns has to be retried with each reported one dropped, until the
// write goes through, then say which parts were left out.

export type ColumnError = { message?: string; code?: string } | null

/** True when Postgres or PostgREST rejected a write because `column` does not
 * exist yet, meaning its migration has not been applied to this project. */
export function isMissingColumn(error: ColumnError, column: string) {
  if (!error) return false
  const message = error.message ?? ""
  return (
    (error.code === "PGRST204" || error.code === "42703" || /column/i.test(message)) &&
    message.includes(column)
  )
}

/**
 * Runs `write` with the base columns plus every optional one, dropping each
 * optional column the database reports missing and trying again.
 *
 * The number of tries is fixed from the starting list, not read from the list
 * as it shrinks. Reading it live ended the loop one try early: with two columns
 * missing, the last one dropped never got its final write, and the person was
 * shown the database's raw "could not find the column" message instead of a
 * saved site.
 *
 * An error that is not about one of the optional columns is returned as it is,
 * with nothing skipped.
 */
export async function writeWithOptionalColumns(
  write: (columns: Record<string, unknown>) => PromiseLike<{ error: ColumnError }>,
  base: Record<string, unknown>,
  optional: Record<string, unknown>
): Promise<{ error: ColumnError; skipped: string[] }> {
  const remaining = { ...optional }
  const skipped: string[] = []
  const tries = Object.keys(optional).length + 1

  for (let attempt = 0; attempt < tries; attempt += 1) {
    const { error } = await write({ ...base, ...remaining })
    const missing = Object.keys(remaining).find((column) =>
      isMissingColumn(error, column)
    )
    if (!missing) return { error, skipped }

    skipped.push(missing)
    delete remaining[missing]
  }

  // Unreachable: the last try has no optional columns left to be missing.
  return { error: { message: "Could not save the site." }, skipped }
}

const notReadyParts: Record<string, { what: string; migration: string }> = {
  description: {
    what: "the site description",
    migration: "listing_details",
  },
}

function joinWords(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/**
 * One plain message for everything that was left out, or null when nothing
 * was. `meaningful` names the skipped columns that actually had something to
 * save: a blank description that could not be written loses nothing, so it is
 * not worth telling anyone about.
 */
export function notReadyMessage(skipped: string[], meaningful: string[]): string | null {
  const parts = skipped
    .filter((column) => meaningful.includes(column))
    .map((column) => notReadyParts[column])
    .filter(Boolean)
  if (parts.length === 0) return null

  const many = parts.length > 1
  return `Saved, except ${joinWords(parts.map((p) => p.what))}. The database needs the ${joinWords(parts.map((p) => p.migration))} migration${many ? "s" : ""} first. Ask the project owner to apply ${many ? "them" : "it"}.`
}
