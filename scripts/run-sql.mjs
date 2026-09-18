import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(".env.local"), "utf8")
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]+)=(.*)$/)
      if (!match) continue
      const key = match[1].trim()
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // no .env.local
  }
}

function readTokenFile(path) {
  try {
    return readFileSync(path, "utf8").trim()
  } catch {
    return ""
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const accessToken =
  process.env.SUPABASE_ACCESS_TOKEN ||
  readTokenFile(join(homedir(), ".supabase", "access-token"))
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const ref = url?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]
const sqlPath = "supabase/migrations/20260918000000_listings.sql"
const query = readFileSync(resolve(sqlPath), "utf8")

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  process.exit(1)
}

async function listingsReadable() {
  const listings = await fetch(`${url}/rest/v1/listings?select=id,name&limit=6`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  })
  const body = await listings.text()
  if (!listings.ok) return { ok: false, body }
  console.log("listings readable:", body)
  return { ok: true, body }
}

async function configureAuth(token) {
  if (!ref) return

  const redirects = [
    "http://localhost:3000",
    "http://localhost:3000/**",
    "http://localhost:3000/auth/callback",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3000/**",
    "http://127.0.0.1:3000/auth/callback",
  ]

  const payload = {
    SITE_URL: "http://localhost:3000",
    URI_ALLOW_LIST: redirects.join(","),
  }

  if (googleClientId && googleClientSecret) {
    payload.EXTERNAL_GOOGLE_ENABLED = true
    payload.EXTERNAL_GOOGLE_CLIENT_ID = googleClientId
    payload.EXTERNAL_GOOGLE_SECRET = googleClientSecret
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )
  const body = await response.text()
  if (!response.ok) {
    console.error("Auth config patch failed:", response.status, body)
    return
  }
  console.log(
    googleClientId
      ? "Auth URLs updated; Google provider enabled"
      : "Auth URLs updated (Google still needs a Cloud client ID in the dashboard)"
  )
}

function applyViaCli() {
  if (!ref) return false
  const result = spawnSync(
    "npx",
    [
      "supabase",
      "db",
      "query",
      "--linked",
      "--project-ref",
      ref,
      "-f",
      sqlPath,
    ],
    { stdio: "inherit", shell: true }
  )
  return result.status === 0
}

async function applyViaManagement(token) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  )
  const body = await response.text()
  if (!response.ok) {
    console.error("Management API failed:", response.status, body)
    return false
  }
  console.log("Applied schema via Management API")
  await configureAuth(token)
  return true
}

if (applyViaCli()) {
  console.log("Applied schema via supabase CLI")
  await listingsReadable()
  if (accessToken) await configureAuth(accessToken)
  process.exit(0)
}

if (accessToken && ref) {
  const applied = await applyViaManagement(accessToken)
  if (applied) {
    await listingsReadable()
    process.exit(0)
  }
}

if (serviceRole) {
  const response = await fetch(`${url}/pg/query`, {
    method: "POST",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })
  const body = await response.text()
  if (response.ok) {
    console.log("Applied schema via pg/query")
    await listingsReadable()
    process.exit(0)
  }
  console.error("pg/query failed:", response.status, body)
}

const existing = await listingsReadable()
if (existing.ok) {
  console.log("listings table already exists (anon can read it)")
  process.exit(0)
}

console.error(
  "Need `npx supabase login`, or SUPABASE_ACCESS_TOKEN, or paste supabase/seed.sql in the SQL editor."
)
process.exit(2)
