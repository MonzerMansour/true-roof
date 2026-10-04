import { NextResponse } from "next/server"

import { checkDeadline } from "@/lib/obligations/deadline-rules"
import { isReaderConfigured } from "@/lib/obligations/openai-json"
import { readDeadline } from "@/lib/obligations/read-deadline"
import { parseLocalDate } from "@/lib/obligations/recurrence"

const MAX_LENGTH = 400

// Reads one typed sentence into deadline fields and runs the program rules on
// the result. Saves nothing: the deadline list lives on the phone, and the
// person confirms the fields before it is added. Guests can use it, like the
// rest of Financials. The sentence is not logged.
export async function POST(request: Request) {
  if (!isReaderConfigured()) {
    return NextResponse.json({ reason: "not_configured" }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as {
    sentence?: unknown
    today?: unknown
  } | null

  const sentence = typeof body?.sentence === "string" ? body.sentence.trim() : ""
  if (!sentence || sentence.length > MAX_LENGTH) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  // The phone's date, so "tomorrow" means tomorrow where she is.
  const today =
    typeof body?.today === "string" && parseLocalDate(body.today)
      ? body.today
      : new Date().toISOString().slice(0, 10)

  try {
    const draft = await readDeadline(sentence, today)
    return NextResponse.json(checkDeadline(draft, today, sentence))
  } catch (err) {
    console.error("[/api/deadlines/read]", err instanceof Error ? err.message : err)
    return NextResponse.json({ reason: "failed" }, { status: 502 })
  }
}
