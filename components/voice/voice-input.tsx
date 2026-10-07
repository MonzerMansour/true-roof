"use client"

import * as React from "react"
import { IconMicrophone, IconPlayerStopFilled } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import type { VoiceField } from "@/lib/voice/answer-rules"

/** The cap, enforced here and again on the server. Long enough to answer one
 * question in a full sentence, short enough that nobody records for minutes
 * and pays for it. */
export const MAX_SECONDS = 60

type State =
  | { kind: "idle" }
  | { kind: "recording"; seconds: number }
  | { kind: "sending" }
  | { kind: "proposed"; transcript: string; value: string | null }
  | { kind: "error"; message: string }

/**
 * Say the answer instead of typing it.
 *
 * Literacy cannot be assumed, and neither can a steady hand on a cracked
 * screen. What comes back is never applied on its own: the person sees what
 * was heard and taps to use it, so a wrong transcription is a wasted tap
 * rather than a wrong answer buried in their profile.
 *
 * With the network off this does not pretend to work. There is no offline
 * speech model here; the control says so and the typed input stays where it
 * is, which is the honest fallback.
 */
export function VoiceInput({
  field,
  label,
  onTranscript,
  onProposal,
  optionLabel,
}: {
  /** Omit for a free text box: the words come back with no proposed answer. */
  field?: VoiceField
  /** What this is answering, for the screen reader. */
  label: string
  /** Free text: the words, for the person to edit. */
  onTranscript?: (text: string) => void
  /** A closed question: the proposed option, applied only when confirmed. */
  onProposal?: (value: string) => void
  /** Turns a stored value into the words on screen, so the confirmation says
   * "A small pet" rather than "small_pet". */
  optionLabel?: (value: string) => string
}) {
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [supported, setSupported] = React.useState(true)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof window.MediaRecorder !== "undefined"
    )
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function send(audio: Blob) {
    setState({ kind: "sending" })

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setState({
        kind: "error",
        message: "You are offline, so this cannot be sent. Type it instead.",
      })
      return
    }

    try {
      const body = new FormData()
      body.append("audio", audio)
      if (field) body.append("field", field)

      const response = await fetch("/api/voice", { method: "POST", body })
      const data = (await response.json().catch(() => null)) as {
        transcript?: string
        value?: string | null
        reason?: string
      } | null

      if (!response.ok || !data || data.reason) {
        setState({
          kind: "error",
          message:
            data?.reason === "not_configured"
              ? "Speaking answers is not switched on yet. Type it instead."
              : "That did not come through. Try again, or type it instead.",
        })
        return
      }

      const transcript = (data.transcript ?? "").trim()
      if (!transcript) {
        setState({
          kind: "error",
          message: "Nothing was picked up. Try again, or type it instead.",
        })
        return
      }

      // Free text goes straight into the box for her to edit. It is her own
      // words in a field she can see, so there is nothing to confirm.
      if (!field && onTranscript) {
        onTranscript(transcript)
        setState({ kind: "idle" })
        return
      }

      setState({ kind: "proposed", transcript, value: data.value ?? null })
    } catch {
      setState({
        kind: "error",
        message: "That did not come through. Try again, or type it instead.",
      })
    }
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        })
        if (audio.size > 0) void send(audio)
        else setState({ kind: "idle" })
      }

      recorder.start()
      setState({ kind: "recording", seconds: 0 })

      timerRef.current = setInterval(() => {
        setState((current) => {
          if (current.kind !== "recording") return current
          const seconds = current.seconds + 1
          if (seconds >= MAX_SECONDS) {
            stopTimer()
            if (recorderRef.current?.state === "recording") {
              recorderRef.current.stop()
            }
            return { kind: "sending" }
          }
          return { kind: "recording", seconds }
        })
      }, 1000)
    } catch {
      setState({
        kind: "error",
        message:
          "The microphone is not available. Check permissions, or type it instead.",
      })
    }
  }

  function stop() {
    stopTimer()
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        This phone cannot record audio, so type your answer instead.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {state.kind === "recording" ? (
        <Button
          type="button"
          size="touch"
          variant="destructive"
          onClick={stop}
          aria-label={`Stop recording your answer for ${label}`}
        >
          <IconPlayerStopFilled />
          Stop ({MAX_SECONDS - state.seconds}s left)
        </Button>
      ) : (
        <Button
          type="button"
          size="touch"
          variant="outline"
          disabled={state.kind === "sending"}
          onClick={start}
          aria-label={`Say your answer for ${label} instead of typing`}
        >
          <IconMicrophone />
          {state.kind === "sending" ? "Listening…" : "Say it instead"}
        </Button>
      )}

      {/* Everything below is announced, because the whole point is that the
          person may not be reading the screen. */}
      <div aria-live="polite" className="grid gap-2">
        {state.kind === "recording" ? (
          <p className="text-sm text-muted-foreground">
            Listening. {MAX_SECONDS - state.seconds} seconds left.
          </p>
        ) : null}

        {state.kind === "proposed" ? (
          <div className="rounded-lg border bg-card p-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Heard:</span> &ldquo;
              {state.transcript}&rdquo;
            </p>
            {state.value ? (
              <>
                <p className="mt-2 text-sm font-medium">
                  Use {optionLabel ? optionLabel(state.value) : state.value}?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="touch"
                    onClick={() => {
                      onProposal?.(state.value as string)
                      setState({ kind: "idle" })
                    }}
                  >
                    Yes, use that
                  </Button>
                  <Button
                    type="button"
                    size="touch"
                    variant="outline"
                    onClick={() => setState({ kind: "idle" })}
                  >
                    No, pick it myself
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm">
                That did not match one of the answers. Tap the one you want
                below, or say it again.
              </p>
            )}
          </div>
        ) : null}

        {state.kind === "error" ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}
      </div>
    </div>
  )
}
