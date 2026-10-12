import { NextResponse } from "next/server"

import { isGmailConfigured, sendLateAlertEmail } from "@/lib/email/gmail"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const MAX_REASONS = 4
const MAX_REASON_LENGTH = 200
const MAX_IDS = 24
const MAX_ID_LENGTH = 80

type Body = {
  level?: unknown
  reasons?: unknown
  occurrenceIds?: unknown
}

function cleanReasons(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_REASON_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_REASONS)
}

function cleanIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_ID_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_IDS)
}

export async function POST(request: Request) {
  if (!isGmailConfigured()) {
    return NextResponse.json({ reason: "not_configured" }, { status: 503 })
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ reason: "auth_unavailable" }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ reason: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  const level = body?.level === "act" || body?.level === "watch" ? body.level : null
  if (!level) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  const reasons = cleanReasons(body?.reasons)
  // occurrenceIds are accepted for future server-side dedupe; Plan A dedupes
  // on the client. Validate shape so callers cannot send junk.
  cleanIds(body?.occurrenceIds)

  try {
    await sendLateAlertEmail({
      to: user.email,
      reasons:
        reasons.length > 0
          ? reasons
          : level === "act"
            ? ["Something on your plan is overdue."]
            : ["Something on your plan needs a look soon."],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(
      "[/api/alerts/email]",
      err instanceof Error ? err.message : "failed"
    )
    return NextResponse.json({ reason: "failed" }, { status: 502 })
  }
}
