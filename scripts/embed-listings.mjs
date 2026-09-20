// Embeds every listing into public.listing_embeddings. Run after the
// 20260921000000_vector_search migration, and again when listings change:
//   npm run embeddings:listings
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.
import { readFileSync } from "node:fs"
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

// Keep in sync with listingToText in lib/embeddings/text.ts.
const pets = {
  not_allowed: "pets: not allowed",
  service_only: "pets: service animals only",
  small_pets: "pets: small pets under a weight limit",
  any: "pets: any pet",
}
const couples = {
  not_allowed: "couples: not allowed",
  same_room: "couples: same room",
  separate_rooms: "couples: separate rooms",
}

function toText(row) {
  const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
  return [
    `${row.kind === "shelter" ? "Shelter" : "Safe parking"}: ${row.name}, run by ${org?.name ?? row.name}, in ${row.city}.`,
    row.pets ? `${pets[row.pets]}.` : null,
    row.couples ? `${couples[row.couples]}.` : null,
    row.parking_status ? `Parking status: ${row.parking_status}.` : null,
    row.vehicle_note ? `Vehicles: ${row.vehicle_note}.` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

async function embed(input) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model, input }),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}`)
  return (await response.json()).data[0].embedding
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await supabase
  .from("listings")
  .select("id, name, kind, pets, couples, parking_status, vehicle_note, city, organizations(name)")

if (error) {
  console.error(error.message)
  process.exit(1)
}

for (const row of data) {
  const content = toText(row)
  const embedding = await embed(content)
  const { error: upsertError } = await supabase.from("listing_embeddings").upsert({
    listing_id: row.id,
    content,
    embedding: JSON.stringify(embedding),
    model,
    updated_at: new Date().toISOString(),
  })
  if (upsertError) {
    console.error(`${row.name}: ${upsertError.message}`)
    process.exit(1)
  }
  console.log(`Embedded ${row.name}`)
}
