import type { SeekerNeeds } from "./needs"

// Local-first: answers stay on this device until the person chooses to share.
const NEEDS_KEY = "true-roof:seeker-needs:v1"
const DRAFT_KEY = "true-roof:seeker-needs-draft:v1"

function read(key: string): unknown {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or blocked. The answers still show on screen.
  }
}

function remove(key: string) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to clear.
  }
}

// A damaged or old entry must never crash the page, so check the shape.
function isNeeds(value: unknown): value is SeekerNeeds {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>

  return (
    typeof v.household === "string" &&
    typeof v.pet === "string" &&
    typeof v.idStatus === "string" &&
    typeof v.vehicle === "string" &&
    typeof v.arrivalFrom === "string" &&
    typeof v.arrivalTo === "string" &&
    typeof v.daysNeeded === "number"
  )
}

export function loadNeeds(): SeekerNeeds | null {
  const value = read(NEEDS_KEY)
  return isNeeds(value) ? value : null
}

export function saveNeeds(needs: SeekerNeeds) {
  write(NEEDS_KEY, needs)
}

export function clearNeeds() {
  remove(NEEDS_KEY)
  remove(DRAFT_KEY)
}

export type StoredDraft = { draft: Record<string, unknown>; index: number }

export function loadDraft(): StoredDraft | null {
  const value = read(DRAFT_KEY) as Partial<StoredDraft> | null

  if (
    !value ||
    typeof value.index !== "number" ||
    !value.draft ||
    typeof value.draft !== "object"
  ) {
    return null
  }

  return value as StoredDraft
}

export function saveDraft(draft: StoredDraft) {
  write(DRAFT_KEY, draft)
}

export function clearDraft() {
  remove(DRAFT_KEY)
}
