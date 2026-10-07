// Display preferences a person sets for themselves.
//
// Separate from next-themes, which owns light/dark. These are the two settings
// that decide whether the app is usable at all for someone with low vision, so
// they are a first-class control rather than something buried in a menu.
//
// Both are applied as attributes on <html> and read by CSS in app/globals.css,
// so there is no re-render cost and no flash of the wrong size: an inline
// script in app/layout.tsx sets them before first paint.

export const textSizeValues = ["normal", "large", "larger"] as const
export type TextSize = (typeof textSizeValues)[number]

export const contrastValues = ["normal", "high"] as const
export type Contrast = (typeof contrastValues)[number]

export type A11yPreferences = {
  textSize: TextSize
  contrast: Contrast
}

export const defaultA11yPreferences: A11yPreferences = {
  textSize: "normal",
  contrast: "normal",
}

export const textSizeLabel: Record<TextSize, string> = {
  normal: "Normal",
  large: "Large",
  larger: "Largest",
}

export const contrastLabel: Record<Contrast, string> = {
  normal: "Normal",
  high: "High contrast",
}

/** How much every rem-based size grows. Tailwind sizes and spacing are all in
 * rem, so scaling the root font size scales the whole layout together rather
 * than leaving big text in small boxes. */
export const textScale: Record<TextSize, number> = {
  normal: 1,
  large: 1.25,
  larger: 1.5,
}

export const TEXT_SIZE_ATTR = "data-text-size"
export const CONTRAST_ATTR = "data-contrast"
export const A11Y_STORAGE_KEY = "true-roof:a11y:v1"

function isTextSize(value: unknown): value is TextSize {
  return (
    typeof value === "string" &&
    (textSizeValues as readonly string[]).includes(value)
  )
}

function isContrast(value: unknown): value is Contrast {
  return (
    typeof value === "string" &&
    (contrastValues as readonly string[]).includes(value)
  )
}

export function parseA11yPreferences(raw: unknown): A11yPreferences {
  if (!raw || typeof raw !== "object") return defaultA11yPreferences
  const value = raw as Record<string, unknown>
  return {
    textSize: isTextSize(value.textSize)
      ? value.textSize
      : defaultA11yPreferences.textSize,
    contrast: isContrast(value.contrast)
      ? value.contrast
      : defaultA11yPreferences.contrast,
  }
}

export function loadA11yPreferences(): A11yPreferences {
  if (typeof window === "undefined") return defaultA11yPreferences
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY)
    return raw ? parseA11yPreferences(JSON.parse(raw)) : defaultA11yPreferences
  } catch {
    return defaultA11yPreferences
  }
}

export function saveA11yPreferences(preferences: A11yPreferences) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage can be full or blocked. The setting still applies this session.
  }
}

export function applyA11yPreferences(preferences: A11yPreferences) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.setAttribute(TEXT_SIZE_ATTR, preferences.textSize)
  root.setAttribute(CONTRAST_ATTR, preferences.contrast)
}

/** Runs before first paint, inlined in app/layout.tsx.
 *
 * Without this the page renders at normal size and then jumps once React
 * hydrates, which is exactly the person this setting exists for watching the
 * text they need resize under them. Kept as a string so it can go in a
 * dangerouslySetInnerHTML script tag, and deliberately tiny and defensive:
 * it runs before anything else and must never throw. */
export const a11yBootScript = `
(function(){try{
var raw = localStorage.getItem(${JSON.stringify(A11Y_STORAGE_KEY)});
if(!raw) return;
var p = JSON.parse(raw);
var sizes = ${JSON.stringify(textSizeValues)};
var contrasts = ${JSON.stringify(contrastValues)};
var e = document.documentElement;
if (p && sizes.indexOf(p.textSize) > -1) e.setAttribute(${JSON.stringify(TEXT_SIZE_ATTR)}, p.textSize);
if (p && contrasts.indexOf(p.contrast) > -1) e.setAttribute(${JSON.stringify(CONTRAST_ATTR)}, p.contrast);
}catch(_){}})();
`.trim()
