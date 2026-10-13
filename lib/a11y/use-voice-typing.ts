"use client"

import * as React from "react"

import {
  A11Y_CHANGE_EVENT,
  A11Y_STORAGE_KEY,
  loadA11yPreferences,
  saveA11yPreferences,
} from "@/lib/a11y/preferences"

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === A11Y_STORAGE_KEY) onChange()
  }
  window.addEventListener(A11Y_CHANGE_EVENT, onChange)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(A11Y_CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onStorage)
  }
}

/** Whether the voice typing mic is switched on, kept in step everywhere. */
export function useVoiceTyping(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => loadA11yPreferences().voiceTyping,
    () => false
  )
}

export function setVoiceTyping(on: boolean) {
  saveA11yPreferences({ ...loadA11yPreferences(), voiceTyping: on })
}
