"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { themeOptions } from "@/components/theme-toggle"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  A11Y_CHANGE_EVENT,
  applyA11yPreferences,
  contrastLabel,
  contrastValues,
  defaultA11yPreferences,
  loadA11yPreferences,
  saveA11yPreferences,
  textSizeLabel,
  textSizeValues,
  type A11yPreferences,
} from "@/lib/a11y/preferences"

/**
 * Text size and contrast, set by the person rather than guessed from the
 * device. Someone can be on a phone whose system text size they have never
 * found, or borrowing a phone that is not theirs.
 *
 * Changes apply immediately and are announced, so the control works whether
 * you can see the result or not.
 */
export function DisplaySettings() {
  const [preferences, setPreferences] = React.useState<A11yPreferences>(
    defaultA11yPreferences
  )
  const [ready, setReady] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    const saved = loadA11yPreferences()
    setPreferences(saved)
    applyA11yPreferences(saved)
    setReady(true)

    // The sidebar can switch voice typing too. Pick that up, so a later change
    // here does not save a stale copy over it.
    const sync = () => setPreferences(loadA11yPreferences())
    window.addEventListener(A11Y_CHANGE_EVENT, sync)
    return () => window.removeEventListener(A11Y_CHANGE_EVENT, sync)
  }, [])

  function update(next: Partial<A11yPreferences>, announce: string) {
    const merged = { ...preferences, ...next }
    setPreferences(merged)
    applyA11yPreferences(merged)
    saveA11yPreferences(merged)
    setAnnouncement(announce)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme, text, and voice</CardTitle>
        <CardDescription className="text-base">
          Pick light or dark, make the words bigger, turn up the contrast, or
          speak instead of typing. This changes straight away and stays set on
          this phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <fieldset>
          <legend className="text-sm font-medium">Theme</legend>
          <p className="mt-1 text-sm text-muted-foreground" id="theme-help">
            Auto follows your phone, so it turns dark at night if your phone
            does. Light and Dark stay put.
          </p>
          <div
            className="mt-3 flex flex-wrap gap-3"
            role="group"
            aria-describedby="theme-help"
          >
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="touch"
                variant={ready && theme === option.value ? "default" : "outline"}
                aria-pressed={ready && theme === option.value}
                onClick={() => {
                  setTheme(option.value)
                  setAnnouncement(`Theme ${option.label.toLowerCase()}`)
                }}
              >
                <option.icon />
                {option.label}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Text size</legend>
          <p className="mt-1 text-sm text-muted-foreground" id="text-size-help">
            Everything grows together, not just the words.
          </p>
          <div
            className="mt-3 flex flex-wrap gap-3"
            role="group"
            aria-describedby="text-size-help"
          >
            {textSizeValues.map((value) => (
              <Button
                key={value}
                type="button"
                size="touch"
                variant={preferences.textSize === value ? "default" : "outline"}
                aria-pressed={ready && preferences.textSize === value}
                onClick={() =>
                  update(
                    { textSize: value },
                    `Text size ${textSizeLabel[value].toLowerCase()}`
                  )
                }
              >
                {textSizeLabel[value]}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Contrast</legend>
          <p className="mt-1 text-sm text-muted-foreground" id="contrast-help">
            Stronger text, darker edges, and no moving decoration.
          </p>
          <div
            className="mt-3 flex flex-wrap gap-3"
            role="group"
            aria-describedby="contrast-help"
          >
            {contrastValues.map((value) => (
              <Button
                key={value}
                type="button"
                size="touch"
                variant={preferences.contrast === value ? "default" : "outline"}
                aria-pressed={ready && preferences.contrast === value}
                onClick={() =>
                  update(
                    { contrast: value },
                    value === "high" ? "High contrast on" : "High contrast off"
                  )
                }
              >
                {contrastLabel[value]}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Voice typing</legend>
          <p className="mt-1 text-sm text-muted-foreground" id="voice-typing-help">
            Puts a microphone in the bottom right corner. Tap any text box, then
            tap the microphone and speak. Your words go into that box for you to
            check. Recording only starts when you tap it.
          </p>
          <div
            className="mt-3 flex flex-wrap gap-3"
            role="group"
            aria-describedby="voice-typing-help"
          >
            {[false, true].map((on) => (
              <Button
                key={String(on)}
                type="button"
                size="touch"
                variant={preferences.voiceTyping === on ? "default" : "outline"}
                aria-pressed={ready && preferences.voiceTyping === on}
                onClick={() =>
                  update(
                    { voiceTyping: on },
                    on ? "Voice typing on. The microphone is in the bottom right corner." : "Voice typing off"
                  )
                }
              >
                {on ? "On" : "Off"}
              </Button>
            ))}
          </div>
        </fieldset>

        {/* Confirms the change for anyone who cannot see it happen. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </CardContent>
    </Card>
  )
}
