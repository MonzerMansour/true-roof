"use client"

import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react"
import { toast } from "sonner"

import { cn } from "cn"
import { setVoiceTyping, useVoiceTyping } from "@/lib/a11y/use-voice-typing"

/** The voice typing switch for places without the app sidebar: the guest
 * header and its phone menu. Like the sidebar, it only shows once voice typing
 * is turned on in Settings, as a quick way to turn it off. */
export function VoiceTypingToggle({
  showLabel = false,
  className,
  onToggled,
}: {
  showLabel?: boolean
  className?: string
  onToggled?: () => void
}) {
  const on = useVoiceTyping()
  if (!on) return null
  const label = `Voice typing: ${on ? "On" : "Off"}`

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={showLabel ? undefined : label}
      title={showLabel ? undefined : label}
      onClick={() => {
        setVoiceTyping(!on)
        toast.success(
          on
            ? "Voice typing off."
            : "Voice typing on. Tap a text box, then the microphone in the bottom right."
        )
        onToggled?.()
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        showLabel ? "px-0 py-1 text-base font-medium" : "p-2",
        on && !showLabel && "bg-primary/10 text-primary",
        className
      )}
    >
      {on ? <IconMicrophone className="size-5" /> : <IconMicrophoneOff className="size-5" />}
      {showLabel ? <span>{label}</span> : null}
    </button>
  )
}
