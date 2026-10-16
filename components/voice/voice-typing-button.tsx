"use client"

import * as React from "react"
import {
  IconLoader2,
  IconMicrophone,
  IconPlayerStopFilled,
} from "@tabler/icons-react"

import { MAX_SECONDS } from "@/components/voice/voice-input"
import { cn } from "cn"
import { useVoiceTyping } from "@/lib/a11y/use-voice-typing"

type Editable = HTMLInputElement | HTMLTextAreaElement

// Input types a person types words into. Password is deliberately missing:
// speaking a password aloud, and sending it to be transcribed, is never okay.
const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "tel", "url", ""])

function isEditable(node: EventTarget | null): node is Editable {
  if (node instanceof HTMLTextAreaElement) return !node.readOnly && !node.disabled
  if (node instanceof HTMLInputElement) {
    return (
      TEXT_INPUT_TYPES.has(node.type) &&
      !node.readOnly &&
      !node.disabled &&
      !/^(cc-|one-time-code|current-password|new-password)/.test(node.autocomplete)
    )
  }
  return false
}

/** Puts words at the cursor, the way typing would, so React's onChange and
 * an uncontrolled form both see them. Setting .value directly would be
 * ignored by React, so this goes through the native setter and fires input. */
function insertAtCursor(field: Editable, words: string) {
  const value = field.value
  let start = value.length
  let end = value.length
  try {
    start = field.selectionStart ?? value.length
    end = field.selectionEnd ?? value.length
  } catch {
    // Email inputs have no selection API. Append instead.
  }

  const before = value.slice(0, start)
  const after = value.slice(end)
  const spaceBefore = before && !/\s$/.test(before) ? " " : ""
  const spaceAfter = after && !/^\s/.test(after) ? " " : ""
  let next = `${before}${spaceBefore}${words}${spaceAfter}${after}`
  if (field.maxLength > 0) next = next.slice(0, field.maxLength)

  const prototype =
    field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, next)
  field.dispatchEvent(new Event("input", { bubbles: true }))

  field.focus()
  const caret = Math.min(next.length, before.length + spaceBefore.length + words.length)
  try {
    field.setSelectionRange(caret, caret)
  } catch {
    // Not supported on this input type.
  }
}

function fieldName(field: Editable) {
  const labelled = field.labels?.[0]?.textContent?.trim()
  return labelled || field.getAttribute("aria-label") || field.placeholder || "the text box"
}

type State =
  | { kind: "idle" }
  | { kind: "recording"; seconds: number }
  | { kind: "sending" }
  | { kind: "message"; text: string }

/**
 * Voice typing for the whole app, switched on in Settings or the sidebar.
 * Tap any text box, then this mic, then speak. The words land in that box
 * for the person to read and fix. Nothing records until the mic is tapped,
 * and the audio is dropped after transcription by /api/voice.
 */
export function VoiceTypingButton() {
  const enabled = useVoiceTyping()
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const targetRef = React.useRef<Editable | null>(null)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Remember the last text box the person was in. Tapping the mic would
  // otherwise move focus to the mic and lose it.
  React.useEffect(() => {
    if (!enabled) return
    const onFocus = (event: FocusEvent) => {
      if (isEditable(event.target)) targetRef.current = event.target
    }
    document.addEventListener("focusin", onFocus)
    return () => document.removeEventListener("focusin", onFocus)
  }, [enabled])

  const stopTimer = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  // Turning the setting off mid-recording stops the microphone.
  React.useEffect(() => {
    if (enabled) return
    stopTimer()
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    recorderRef.current = null
  }, [enabled, stopTimer])

  React.useEffect(() => {
    if (state.kind !== "message") return
    const timeout = setTimeout(() => setState({ kind: "idle" }), 5000)
    return () => clearTimeout(timeout)
  }, [state])

  if (!enabled) return null

  async function send(audio: Blob, field: Editable) {
    setState({ kind: "sending" })
    if (navigator.onLine === false) {
      setState({ kind: "message", text: "You are offline, so this cannot be sent. Type it instead." })
      return
    }
    try {
      const body = new FormData()
      body.append("audio", audio)
      const response = await fetch("/api/voice", { method: "POST", body })
      const data = (await response.json().catch(() => null)) as {
        transcript?: string
        reason?: string
      } | null

      if (!response.ok || !data || data.reason) {
        setState({
          kind: "message",
          text:
            data?.reason === "not_configured"
              ? "Voice typing is not switched on for this app yet."
              : "That did not come through. Try again.",
        })
        return
      }

      const words = (data.transcript ?? "").trim()
      if (!words) {
        setState({ kind: "message", text: "Nothing was picked up. Try again." })
        return
      }
      if (!field.isConnected) {
        setState({ kind: "message", text: "That text box is gone. Tap one and try again." })
        return
      }

      insertAtCursor(field, words)
      setState({ kind: "message", text: `Added to ${fieldName(field)}. Check it before you save.` })
    } catch {
      setState({ kind: "message", text: "That did not come through. Try again." })
    }
  }

  async function start() {
    // The box that has focus right now wins (tapping the mic does not take
    // focus away). The remembered one covers a tap that did.
    const active = document.activeElement
    const field = isEditable(active) ? active : targetRef.current
    if (!field || !field.isConnected) {
      setState({ kind: "message", text: "Tap a text box first, then tap the microphone." })
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setState({ kind: "message", text: "This phone cannot record audio. Type it instead." })
      return
    }

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
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        if (audio.size > 0) void send(audio, field)
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
            if (recorderRef.current?.state === "recording") recorderRef.current.stop()
            return { kind: "sending" }
          }
          return { kind: "recording", seconds }
        })
      }, 1000)
    } catch {
      setState({
        kind: "message",
        text: "The microphone is not available. Check permissions, or type it instead.",
      })
    }
  }

  function stop() {
    stopTimer()
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }

  const recording = state.kind === "recording"
  const sending = state.kind === "sending"
  const status =
    state.kind === "recording"
      ? `Listening. ${MAX_SECONDS - state.seconds} seconds left. Tap to stop.`
      : state.kind === "sending"
        ? "Turning your words into text..."
        : state.kind === "message"
          ? state.text
          : ""

  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-50 flex items-center gap-2 sm:right-5 sm:bottom-22">
      {status ? (
        <p className="pointer-events-auto max-w-[min(18rem,calc(100vw-7rem))] rounded-xl bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg ring-1 ring-border">
          {status}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
      <button
        type="button"
        // Keep focus (and the cursor) in the text box when the mic is tapped.
        onPointerDown={(event) => event.preventDefault()}
        onMouseDown={(event) => event.preventDefault()}
        onClick={recording ? stop : start}
        disabled={sending}
        aria-pressed={recording}
        aria-label={recording ? "Stop voice typing" : "Voice typing: speak into the last text box you tapped"}
        className={cn(
          "pointer-events-auto flex size-14 items-center justify-center rounded-full shadow-lg ring-1 ring-border/60 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70",
          recording
            ? "bg-background text-destructive ring-3 ring-destructive"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {recording ? (
          <IconPlayerStopFilled className="size-6" />
        ) : sending ? (
          <IconLoader2 className="size-6 animate-spin" />
        ) : (
          <IconMicrophone className="size-6" />
        )}
      </button>
    </div>
  )
}
