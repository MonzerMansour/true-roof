// Embeds every listing into public.listing_embeddings. Run after the
// 20260921000000_vector_search migration, and again when listings change:
//   npm run embeddings:listings
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

try {
  for (const line of readFileSync(resolve(".env.local"), "utf8").split(
    /\r?\n/
  )) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/)
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // no .env.local
}

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY } =
  process.env
const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small"

if (
  !NEXT_PUBLIC_SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !OPENAI_API_KEY
) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY in .env.local."
  )
  process.exit(1)
}

// Hand-written copy of listingToText from lib/embeddings/text.ts.
//
// This file is a plain .mjs with no build step, so it cannot resolve the "@/"
// alias that module's import chain uses. The duplication is guarded by a fixture
// test in lib/embeddings/text.test.ts, which fails if the two drift. Change one,
// change both, then re-run this script.
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
const idRequired = {
  required: "Photo ID required",
  not_required: "No ID needed",
  case_by_case: "ID asked for, but they work with you",
}
const maxStay = {
  one_night: "One night at a time",
  up_to_7_nights: "Up to 7 nights",
  up_to_14_nights: "Up to 14 nights",
  up_to_30_nights: "Up to 30 nights",
  up_to_90_nights: "Up to 90 nights",
  up_to_180_nights: "Up to 180 nights",
  no_limit: "No set limit on nights",
}
const vehicleAllowed = {
  car_only: "Cars only, no vans or RVs",
  car_van: "Cars and vans",
  car_van_rv: "Cars, vans, and RVs",
}
const registrationRequired = {
  required: "Registration and plates required",
  not_required: "No registration needed",
  case_by_case: "Registration asked for, but they work with you",
}

function hhmm(value) {
  const match = String(value ?? "").match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : null
}

function clock(value) {
  const [rawHour, minute] = value.split(":")
  const hour = Number(rawHour)
  const suffix = hour < 12 ? "AM" : "PM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${minute} ${suffix}`
}

function intakeWindow(from, to) {
  const wraps = to < from
  const window = `${clock(from)} to ${clock(to)}`
  return wraps ? `${window} (past midnight)` : window
}

function toText(row) {
  const org = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations
  const curfewTime = hhmm(row.curfew_time)
  const intakeFrom = hhmm(row.intake_from)
  const intakeTo = hhmm(row.intake_to)

  return [
    `${row.kind === "shelter" ? "Shelter" : "Safe parking"}: ${row.name}, run by ${org?.name ?? row.name}, in ${row.city}.`,
    row.pets
      ? `${pets[row.pets]}${row.pet_weight_limit_lbs ? `, up to ${row.pet_weight_limit_lbs} pounds` : ""}.`
      : null,
    row.couples ? `${couples[row.couples]}.` : null,
    row.id_required ? `${idRequired[row.id_required]}.` : null,
    row.curfew_policy === "no_curfew"
      ? "No curfew."
      : row.curfew_policy === "fixed_time" && curfewTime
        ? `Doors lock at ${clock(curfewTime)}.`
        : null,
    intakeFrom && intakeTo
      ? `Check in ${intakeWindow(intakeFrom, intakeTo)}.`
      : null,
    row.max_stay ? `${maxStay[row.max_stay]}.` : null,
    row.parking_status ? `Parking status: ${row.parking_status}.` : null,
    row.vehicle_allowed ? `${vehicleAllowed[row.vehicle_allowed]}.` : null,
    row.registration_required
      ? `${registrationRequired[row.registration_required]}.`
      : null,
    row.vehicle_note ? `Lot notes: ${row.vehicle_note}.` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

async function embed(input) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, input }),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}`)
  return (await response.json()).data[0].embedding
}

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from("listings")
  .select(
    "id, name, kind, pets, couples, parking_status, vehicle_note, city, pet_weight_limit_lbs, id_required, curfew_policy, curfew_time, intake_from, intake_to, max_stay, vehicle_allowed, registration_required, organizations(name)"
  )

if (error) {
  console.error(error.message)
  process.exit(1)
}

for (const row of data) {
  const content = toText(row)
  const embedding = await embed(content)
  const { error: upsertError } = await supabase
    .from("listing_embeddings")
    .upsert({
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
