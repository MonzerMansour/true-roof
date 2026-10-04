"use client"

import * as React from "react"

// Developer mode shows match analytics (raw cosine scores, phrase-by-phrase
// similarity) on Places. Off by default, per device, turned on in Settings.
// It changes what is shown, never the order of the list.

const KEY = "true-roof:developer-mode"
const EVENT = "true-roof:developer-mode-change"

export function isDeveloperMode(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export function setDeveloperMode(on: boolean) {
  try {
    if (on) window.localStorage.setItem(KEY, "1")
    else window.localStorage.removeItem(KEY)
  } catch {
    // Private mode or blocked storage: the switch just will not stick.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function useDeveloperMode(): boolean {
  return React.useSyncExternalStore(subscribe, isDeveloperMode, () => false)
}
