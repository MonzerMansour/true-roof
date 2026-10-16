/**
 * Smoke-check the late-alert email stack without sending mail.
 * Usage: node scripts/diag-alerts-email.mjs [baseUrl]
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

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

loadEnvLocal()

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "")
const gmailUser = Boolean(process.env.GMAIL_USER?.trim())
const gmailPass = Boolean(process.env.GMAIL_APP_PASSWORD?.trim())
const from = Boolean(process.env.ALERT_EMAIL_FROM?.trim())
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "(unset)"

console.log("Gmail late-alert diagnostic")
console.log("---------------------------")
console.log("GMAIL_USER set:", gmailUser)
console.log("GMAIL_APP_PASSWORD set:", gmailPass)
console.log("ALERT_EMAIL_FROM set:", from)
console.log("NEXT_PUBLIC_APP_URL:", appUrl)
console.log("Configured for send:", gmailUser && gmailPass)

let res
try {
  res = await fetch(`${base}/api/alerts/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      level: "act",
      reasons: ["Diagnostic probe"],
      occurrenceIds: ["diag-1"],
    }),
  })
} catch (err) {
  console.log("POST /api/alerts/email: unreachable", err.message)
  console.log(
    "Start the app (npm run dev), then re-run. Without Gmail env the route should return 503 not_configured."
  )
  process.exit(gmailUser && gmailPass ? 1 : 0)
}

const body = await res.text()
console.log(`POST ${base}/api/alerts/email -> ${res.status}`)
console.log(body)

if (!gmailUser || !gmailPass) {
  if (res.status === 503 && body.includes("not_configured")) {
    console.log("OK: route correctly reports not_configured.")
    process.exit(0)
  }
  console.log("Expected 503 { reason: not_configured } until Gmail env is set.")
  process.exit(1)
}

if (res.status === 401) {
  console.log(
    "OK: Gmail is configured; route requires a signed-in session (unauthorized without cookie)."
  )
  process.exit(0)
}

if (res.status === 200) {
  console.log("Unexpected: sent without a session cookie.")
  process.exit(1)
}

process.exit(res.status === 503 || res.status === 401 ? 0 : 1)
