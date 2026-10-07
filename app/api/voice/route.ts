import { NextResponse } from "next/server"

import {
  proposeAnswer,
  voiceFieldOptions,
  type VoiceField,
} from "@/lib/voice/answer-rules"
import {
  MAX_AUDIO_BYTES,
  isAllowedAudioType,
  isTranscriptionConfigured,
  transcribe,
} from "@/lib/voice/transcribe"

// Transcribes one short recording when she taps the mic, and proposes an
// answer she then has to confirm. Same shape as /api/scan: the model reads,
// separate code decides, and the person has the last word.
//
// The audio is passed to the transcriber and dropped. It is not stored,
// logged, or returned. Guests can use it, like the rest of the questionnaire.
export const runtime = "nodejs"

function isVoiceField(value: unknown): value is VoiceField {
  return typeof value === "string" && value in voiceFieldOptions
}

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

  // Absent means "just give me the words", which is what a free text box
  // wants. A named field also gets a proposed answer.
  const rawField = form.get("field")
  const field = isVoiceField(rawField) ? rawField : null
  if (rawField != null && field === null) {
    return NextResponse.json({ reason: "bad_request" }, { status: 400 })
  }

  try {
    const transcript = await transcribe(audio)

    if (!transcript) {
      return NextResponse.json({ transcript: "", value: null, matched: null })
    }

    if (!field) {
      return NextResponse.json({ transcript, value: null, matched: null })
    }

    return NextResponse.json(proposeAnswer(field, transcript))
  } catch (err) {
    // Deliberately logs no transcript and no audio: both are what she said.
    console.error("[/api/voice]", err instanceof Error ? err.message : "failed")
    return NextResponse.json({ reason: "failed" }, { status: 502 })
  }
}
