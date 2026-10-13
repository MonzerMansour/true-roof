"use client"

import * as React from "react"

import { Textarea } from "@/components/ui/textarea"
import { VoiceInput } from "@/components/voice/voice-input"

/**
 * A text box you can also fill by speaking. The words are added after what is
 * already typed, in the box, for the person to edit before saving. Nothing is
 * sent until they tap the mic, and nothing is applied without them seeing it.
 *
 * Works inside an ordinary <form>: it posts under `name` like a plain
 * textarea. Pass `value` and `onValueChange` to control it instead.
 */
export function VoiceTextarea({
  label,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  maxLength,
  ...props
}: Omit<
  React.ComponentProps<typeof Textarea>,
  "value" | "defaultValue" | "onChange"
> & {
  /** What the box is for, so the mic button's screen reader label makes sense. */
  label: string
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolled

  function setValue(next: string) {
    const capped = maxLength ? next.slice(0, maxLength) : next
    if (controlledValue === undefined) setUncontrolled(capped)
    onValueChange?.(capped)
  }

  return (
    <div className="grid gap-2">
      <Textarea
        {...props}
        maxLength={maxLength}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <VoiceInput
        label={label}
        onTranscript={(words) => {
          const current = value.trimEnd()
          setValue(current ? `${current} ${words}` : words)
        }}
      />
    </div>
  )
}
