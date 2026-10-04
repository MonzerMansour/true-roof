import { NextResponse } from "next/server"

import { isReaderConfigured } from "@/lib/obligations/openai-json"
import { readScan } from "@/lib/obligations/read-scan"
import { parseLocalDate } from "@/lib/obligations/recurrence"
import { checkScan } from "@/lib/obligations/scan-rules"

// The phone shrinks photos to about 1600px JPEG first, which is well under
// this. Vercel rejects request bodies over 4.5 MB anyway.
const MAX_DATA_URL_LENGTH = 4_000_000
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

// Reads one photo only when she taps Read it. The photo is passed to the
// reader and dropped: it is not stored, logged, or returned. Guests can use
// it, like the rest of Financials.
export async function POST(request: Request) {
  if (!isReaderConfigured()) {
    return NextResponse.json({ reason: "not_configured" }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as {
    image?: unknown
    today?: unknown
  } | null

  const image = typeof body?.image === "string" ? body.image : ""
  if (!image || image.length > MAX_DATA_URL_LENGTH || !IMAGE_DATA_URL.test(image)) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  const today =
    typeof body?.today === "string" && parseLocalDate(body.today)
      ? body.today
      : new Date().toISOString().slice(0, 10)

  try {
    const reading = await readScan(image, today)
    return NextResponse.json(checkScan(reading, today))
  } catch (err) {
    console.error("[/api/scan]", err instanceof Error ? err.message : "failed")
    return NextResponse.json({ reason: "failed" }, { status: 502 })
  }
}
