// Server only. Never import this from a client component.
//
// One transcription call. Audio in, words out, and nothing else: this step
// makes no decisions and never sees the question it is answering. Turning
// words into an answer is a separate, validated step in lib/voice/answer-rules.ts,
// the same shape as the letter reader, where readScan() reads and checkScan()
// decides.
//
// Uses the same OPENAI_API_KEY as the reader and the embeddings. Whisper is a
// different endpoint on the same host with the same bearer auth, so there is
// no new credential, but it is billed per minute of audio rather than per
// token, so it is a separate line on the same account.
//
// Neither the audio nor the transcript is stored or logged. The audio exists
// for the length of the request.

const DEFAULT_MODEL = "whisper-1"

export function transcriptionModel() {
  return process.env.TRANSCRIBE_MODEL || DEFAULT_MODEL
}

export function isTranscriptionConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

/** A minute of speech, which is the cap the recorder enforces. Audio is far
 * heavier than the scanner's photo, so this is checked again here rather than
 * trusted from the client. */
export const MAX_AUDIO_BYTES = 8_000_000

export const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
] as const

export function isAllowedAudioType(type: string) {
  return (ALLOWED_AUDIO_TYPES as readonly string[]).includes(
    type.split(";")[0].trim()
  )
}

export async function transcribe(audio: Blob): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.")

  const form = new FormData()
  form.append("file", audio, "speech.webm")
  form.append("model", transcriptionModel())
  // The questionnaire is English for now. Naming it stops the model guessing
  // a language from a short, noisy clip and returning a translation.
  form.append("language", "en")
  form.append("response_format", "text")

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    }
  )

  if (!response.ok) {
    // Deliberately does not include the body: it can echo what was said.
    throw new Error(`Transcription failed: ${response.status}`)
  }

  return (await response.text()).trim()
}
