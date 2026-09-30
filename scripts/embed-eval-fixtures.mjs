// Generates lib/eval/embeddings-data.json: OpenAI embeddings for the 50
// shelter fixtures and 50 seeker-needs fixtures used by the
// /dev/embedding-eval page. Run again whenever the fixtures change:
//   npm run embeddings:eval
// Needs OPENAI_API_KEY in .env.local. This never touches Supabase.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs"
import { execSync } from "node:child_process"
import { resolve } from "node:path"

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

const { OPENAI_API_KEY } = process.env
const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small"

if (!OPENAI_API_KEY) {
  console.error("Set OPENAI_API_KEY in .env.local.")
  process.exit(1)
}

// Run a tiny loader through tsx so TypeScript fixtures and the app's own
// embedding-text builders (lib/embeddings/text.ts) get types stripped the
// same way the app does. Using the real needsToText/listingToText means
// this eval is testing exactly what production sends to OpenAI, not a
// hand-copied version of it.
function runLoader(name, body) {
  const loaderPath = resolve(`.tmp-eval-loader-${name}.mjs`)
  writeFileSync(loaderPath, body)

  try {
    return JSON.parse(
      execSync(`npx tsx ${JSON.stringify(loaderPath)}`, {
        cwd: resolve("."),
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 20,
      })
    )
  } finally {
    unlinkSync(loaderPath)
  }
}

const shelterFixtures = runLoader(
  "shelters",
  `import { shelterFixtures } from ${JSON.stringify(resolve("lib/eval/shelter-fixtures.ts"))};\n` +
    `process.stdout.write(JSON.stringify(shelterFixtures));\n`
)

const needsFixtures = runLoader(
  "needs",
  `import { needsFixtures } from ${JSON.stringify(resolve("lib/eval/needs-fixtures.ts"))};\n` +
    `process.stdout.write(JSON.stringify(needsFixtures));\n`
)

// Build the actual embedding text through the app's real builders. Shelter
// fixtures are categorical fields plus an optional one-sentence
// orgDescription, so they need to look like a Listing to listingToText().
const shelterTexts = runLoader(
  "shelter-texts",
  `import { listingToText } from ${JSON.stringify(resolve("lib/embeddings/text.ts"))};\n` +
    `import { shelterFixtures } from ${JSON.stringify(resolve("lib/eval/shelter-fixtures.ts"))};\n` +
    `const texts = shelterFixtures.map((s) => listingToText({\n` +
    `  id: s.id,\n` +
    `  name: s.name,\n` +
    `  kind: s.kind,\n` +
    `  freshness: "recent",\n` +
    `  lastConfirmedAt: new Date().toISOString(),\n` +
    `  pets: s.pets,\n` +
    `  couples: s.couples,\n` +
    `  parkingStatus: s.parkingStatus,\n` +
    `  vehicleNote: s.vehicleNote,\n` +
    `  city: "San Jose",\n` +
    `  orgName: s.name,\n` +
    `  orgDescription: s.orgDescription,\n` +
    `  lat: null,\n` +
    `  lng: null,\n` +
    `  phone: null,\n` +
    `  intakeMethod: "call",\n` +
    `}));\n` +
    `process.stdout.write(JSON.stringify(texts));\n`
)

const needsTexts = runLoader(
  "needs-texts",
  `import { needsToText } from ${JSON.stringify(resolve("lib/embeddings/text.ts"))};\n` +
    `import { needsFixtures } from ${JSON.stringify(resolve("lib/eval/needs-fixtures.ts"))};\n` +
    `process.stdout.write(JSON.stringify(needsFixtures.map(needsToText)));\n`
)

async function embedBatch(inputs) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model, input: inputs }),
  })
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`)
  }
  const json = await response.json()
  return json.data.map((d) => d.embedding)
}

console.log(`Embedding ${shelterFixtures.length} shelter fixtures...`)
console.log("Sample shelter text:", shelterTexts[0])
const shelterEmbeddings = await embedBatch(shelterTexts)

console.log(`Embedding ${needsFixtures.length} seeker fixtures...`)
console.log("Sample seeker text:", needsTexts[0])
const needsEmbeddings = await embedBatch(needsTexts)

const out = {
  model,
  generatedAt: new Date().toISOString(),
  shelters: shelterFixtures.map((s, i) => ({
    id: s.id,
    name: s.name,
    description: shelterTexts[i],
    embedding: shelterEmbeddings[i],
  })),
  needs: needsFixtures.map((n, i) => ({
    caseNumber: i + 1,
    needs: n,
    text: needsTexts[i],
    embedding: needsEmbeddings[i],
  })),
}

writeFileSync(resolve("lib/eval/embeddings-data.json"), JSON.stringify(out))
console.log(
  `Wrote lib/eval/embeddings-data.json (${out.shelters.length} shelters, ${out.needs.length} needs).`
)
