// Embeds every published listing into public.listing_embeddings, using the
// app's own listingToText() (lib/embeddings/text.ts) so the stored
// embedding always matches what the app would generate. Run after the
// 20260921000000_vector_search migration, and after `npm run inventory:sql`.
// The portal re-embeds a site on its own when staff create or save it.
//   npm run embeddings:listings
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs"
import { execSync } from "node:child_process"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

try {
  for (const line of readFileSync(resolve(".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/)
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // no .env.local
}

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY } = process.env
const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small"

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY in .env.local."
  )
  process.exit(1)
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Every column, so the text includes whatever staff filled in under
// Additional info. "*" also means a database missing a migration still works:
// it just returns fewer columns, and mapListingRow() reads those as null.
const { data, error } = await supabase.from("listings").select("*, organizations(name, description)")

if (error) {
  console.error(error.message)
  process.exit(1)
}

const rows = data
// Run listingToText() through tsx so it gets the real TypeScript builder,
// types stripped the same way the app does, instead of a hand-copied
// duplicate that silently drifts out of sync with lib/embeddings/text.ts.
const loaderPath = resolve(".tmp-embed-listings-loader.mjs")
writeFileSync(
  loaderPath,
  `import { listingToText } from ${JSON.stringify(resolve("lib/embeddings/text.ts"))};\n` +
    `import { mapListingRow } from ${JSON.stringify(resolve("lib/listings/queries.ts"))};\n` +
    `const rows = ${JSON.stringify(rows)};\n` +
    `process.stdout.write(JSON.stringify(rows.map((r) => listingToText(mapListingRow(r)))));\n`
)
let texts
try {
  texts = JSON.parse(
    execSync(`npx tsx ${JSON.stringify(loaderPath)}`, {
      cwd: resolve("."),
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
    })
  )
} finally {
  unlinkSync(loaderPath)
}

async function embed(input) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model, input }),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`)
  return (await response.json()).data[0].embedding
}

// Skip rows whose text and model have not changed, so this is cheap to re-run
// (after `npm run inventory:sql`, or any time something looks missing).
const { data: existingRows, error: existingError } = await supabase
  .from("listing_embeddings")
  .select("listing_id, content, model")
if (existingError) {
  console.error(existingError.message)
  process.exit(1)
}
const existing = new Map(existingRows.map((row) => [row.listing_id, row]))

let embedded = 0
let unchanged = 0
for (let i = 0; i < rows.length; i++) {
  const content = texts[i]
  const current = existing.get(rows[i].id)
  if (current?.content === content && current?.model === model) {
    unchanged += 1
    continue
  }

  const embedding = await embed(content)
  const { error: upsertError } = await supabase.from("listing_embeddings").upsert({
    listing_id: rows[i].id,
    content,
    embedding: JSON.stringify(embedding),
    model,
    updated_at: new Date().toISOString(),
  })
  if (upsertError) {
    console.error(`${rows[i].name}: ${upsertError.message}`)
    process.exit(1)
  }
  embedded += 1
  console.log(`Embedded ${rows[i].name}`)
}

console.log(`Done. ${embedded} embedded, ${unchanged} already up to date.`)
