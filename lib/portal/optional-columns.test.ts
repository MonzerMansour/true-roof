import { describe, expect, it } from "vitest"

import {
  isMissingColumn,
  notReadyMessage,
  writeWithOptionalColumns,
  type ColumnError,
} from "@/lib/portal/optional-columns"

/** A database that has only `known` columns. Like PostgREST it rejects a write
 * naming an unknown column, and reports just one per rejection, chosen by
 * `pick` so a test can force either order. */
function fakeDatabase(
  known: string[],
  pick: (unknown: string[]) => string = (unknown) => unknown[0]
) {
  const writes: string[][] = []

  const write = async (columns: Record<string, unknown>) => {
    const names = Object.keys(columns)
    writes.push(names)
    const unknown = names.filter((name) => !known.includes(name))
    if (unknown.length === 0) return { error: null as ColumnError }
    return {
      error: {
        code: "PGRST204",
        message: `Could not find the '${pick(unknown)}' column of 'listings' in the schema cache`,
      },
    }
  }

  return { write, writes }
}

const base = { name: "Site", city: "San Jose" }
const optional = { description: "About", current_people: 12 }
const baseColumns = Object.keys(base)

describe("isMissingColumn", () => {
  it("reads a PostgREST schema cache error naming the column", () => {
    expect(
      isMissingColumn(
        { code: "PGRST204", message: "Could not find the 'description' column of 'listings' in the schema cache" },
        "description"
      )
    ).toBe(true)
  })

  it("does not match a different column or no error", () => {
    expect(
      isMissingColumn({ code: "PGRST204", message: "Could not find the 'description' column" }, "current_people")
    ).toBe(false)
    expect(isMissingColumn(null, "description")).toBe(false)
  })
})

describe("writeWithOptionalColumns", () => {
  it("saves everything when the database has every column", async () => {
    const db = fakeDatabase([...baseColumns, "description", "current_people"])
    const result = await writeWithOptionalColumns(db.write, base, optional)
    expect(result).toEqual({ error: null, skipped: [] })
    expect(db.writes).toHaveLength(1)
  })

  it("drops one missing column and still saves the rest", async () => {
    const db = fakeDatabase([...baseColumns, "description"])
    const result = await writeWithOptionalColumns(db.write, base, optional)
    expect(result.error).toBeNull()
    expect(result.skipped).toEqual(["current_people"])
  })

  // The case that showed a raw "could not find the 'description' column" toast.
  // The database reported current_people first, then description. The loop used
  // to stop before the final write and returned the description error.
  it("saves when two columns are missing and the database reports the second one first", async () => {
    const db = fakeDatabase(baseColumns, (unknown) => unknown[unknown.length - 1])
    const result = await writeWithOptionalColumns(db.write, base, optional)
    expect(result.error).toBeNull()
    expect(result.skipped.sort()).toEqual(["current_people", "description"])
    // The write that finally went through carried only the base columns.
    expect(db.writes[db.writes.length - 1]).toEqual(baseColumns)
  })

  it("saves when two columns are missing and the database reports the first one first", async () => {
    const db = fakeDatabase(baseColumns, (unknown) => unknown[0])
    const result = await writeWithOptionalColumns(db.write, base, optional)
    expect(result.error).toBeNull()
    expect(result.skipped.sort()).toEqual(["current_people", "description"])
  })

  it("returns an error that is not about an optional column untouched", async () => {
    const write = async () => ({
      error: { code: "23514", message: "new row violates check constraint" },
    })
    const result = await writeWithOptionalColumns(write, base, optional)
    expect(result.error?.message).toBe("new row violates check constraint")
    expect(result.skipped).toEqual([])
  })

  it("does not skip a base column that is missing, it reports it", async () => {
    const db = fakeDatabase(["name", "description", "current_people"])
    const result = await writeWithOptionalColumns(db.write, base, optional)
    expect(result.error?.message).toContain("'city'")
    expect(result.skipped).toEqual([])
  })
})

describe("notReadyMessage", () => {
  it("is null when nothing was skipped", () => {
    expect(notReadyMessage([], ["description"])).toBeNull()
  })

  it("is null when what was skipped had nothing to save", () => {
    expect(notReadyMessage(["description"], [])).toBeNull()
  })

  it("names the part and its migration", () => {
    expect(notReadyMessage(["description"], ["description"])).toBe(
      "Saved, except the site description. The database needs the listing_details migration first. Ask the project owner to apply it."
    )
  })

  it("ignores a column it has no wording for rather than printing nonsense", () => {
    expect(notReadyMessage(["mystery_column"], ["mystery_column"])).toBeNull()
  })
})
