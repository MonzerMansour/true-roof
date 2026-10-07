"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
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

  React.useEffect(() => {
    const saved = loadA11yPreferences()
    setPreferences(saved)
    applyA11yPreferences(saved)
    setReady(true)
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
        <CardTitle>Text and contrast</CardTitle>
        <CardDescription className="text-base">
          Make the words bigger, or turn up the contrast. This changes straight
          away and stays set on this phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
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

        {/* Confirms the change for anyone who cannot see it happen. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </CardContent>
    </Card>
  )
}
