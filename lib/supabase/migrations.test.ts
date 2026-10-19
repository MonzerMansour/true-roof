import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

/** Every migration file, in the order their timestamps put them. */
const files = readdirSync("supabase/migrations")
  .filter((name) => name.endsWith(".sql"))
  .sort()

const runner = readFileSync("scripts/run-sql.mjs", "utf8")

describe("db:setup applies every migration", () => {
  // The point of failure this guards: the access-code and delete-listing
  // migrations were written but never added to the runner's list, so
  // `npm run db:setup` quietly set up a database without them, and the portal
  // failed with "function does not exist" on a machine that had just been set
  // up by the book.
  it("lists each one in scripts/run-sql.mjs", () => {
    for (const name of files) {
      expect(runner, `${name} is not in sqlPaths`).toContain(
        `supabase/migrations/${name}`
      )
    }
  })

  it("found the migrations, so the check above means something", () => {
    expect(files.length).toBeGreaterThan(10)
    expect(files).toContain("20260918000000_listings.sql")
  })
})

describe("plpgsql output columns do not collide with table columns", () => {
  // join_listing_with_code returns table (listing_id uuid, ...). plpgsql turns
  // every output column into a variable, so `on conflict (listing_id)` inside
  // it is read as an expression matching both that variable and the real
  // column, and the call fails with "column reference listing_id is
  // ambiguous". Naming the constraint instead takes the inference out of
  // plpgsql's hands. Any future function returning a column name it also
  // inserts on would break the same way.
  it("never infers a conflict target by column name inside such a function", () => {
    for (const name of files) {
      // Comments go first: the fix for this very bug quotes the broken form in
      // a comment, which the scan would otherwise read as code.
      const sql = readFileSync(`supabase/migrations/${name}`, "utf8").replace(
        /--[^\n]*/g,
        ""
      )

      // Bounded at the body terminator, or one function's scan would run on
      // into the next one's conflict clauses.
      for (const fn of sql.matchAll(
        /create\s+or\s+replace\s+function([\s\S]*?)\$\$;/gi
      )) {
        const body = fn[1]
        const returns = body.match(/returns\s+table\s*\(([^)]*)\)/i)
        if (!returns) continue

        const outNames = returns[1]
          .split(",")
          .map((part) => part.trim().split(/\s+/)[0])
          .filter(Boolean)

        for (const conflict of body.matchAll(/on\s+conflict\s*\(([^)]*)\)/gi)) {
          for (const target of conflict[1].split(",").map((p) => p.trim())) {
            expect(
              outNames,
              `${name}: "on conflict (${conflict[1]})" names ${target}, which is also an output column. Use "on conflict on constraint <name>".`
            ).not.toContain(target)
          }
        }
      }
    }
  })
})
