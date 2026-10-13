import { NextResponse } from "next/server"

import {
  MAX_AUDIO_BYTES,
  isAllowedAudioType,
  isTranscriptionConfigured,
  transcribe,
} from "@/lib/voice/transcribe"

// Voice typing. Transcribes one short recording when the person taps the mic
// and returns the words, which go into the text box they were in for them to
// read and fix. Nothing is applied on their behalf.
//
// The audio is passed to the transcriber and dropped. It is not stored,
// logged, or returned. It needs no account, like the scanner and Financials.
export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!isTranscriptionConfigured()) {
    return NextResponse.json({ reason: "not_configured" }, { status: 503 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  const audio = form.get("audio")
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  // Checked here as well as in the recorder: the client cap is a courtesy,
  // this is the limit.
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ reason: "too_long" }, { status: 413 })
  }

  if (!isAllowedAudioType(audio.type)) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  try {
    const transcript = await transcribe(audio)

    return NextResponse.json({ transcript: transcript ?? "" })
  } catch (err) {
    // Deliberately logs no transcript and no audio: both are what she said.
    console.error("[/api/voice]", err instanceof Error ? err.message : "failed")
    return NextResponse.json({ reason: "failed" }, { status: 502 })
  }
}
