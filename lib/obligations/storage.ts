import { emptyProfile, type ObligationsProfile, type Payment } from "./types"

const PROFILE_KEY = "true-roof:obligations:v1"
const PAYMENTS_KEY = "true-roof:payments:v1"
const COMPLETED_KEY = "true-roof:completed-occurrences:v1"
const DEADLINES_RESET_KEY = "true-roof:deadlines-reset"

// Bump this to clear every phone's typed deadlines (and their done marks) the
// next time the app loads there. Rent, bills, and program dates are kept.
// 1: Oct 2026, deadlines switched to calendar-year display.
const DEADLINES_RESET_VERSION = 1

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadProfile(): ObligationsProfile | null {
  resetDeadlinesOnce()
  return readJSON<ObligationsProfile | null>(PROFILE_KEY, null)
}

function resetDeadlinesOnce() {
  if (typeof window === "undefined") return
  if (readJSON<number>(DEADLINES_RESET_KEY, 0) >= DEADLINES_RESET_VERSION) return

  const profile = readJSON<ObligationsProfile | null>(PROFILE_KEY, null)
  if (profile?.deadlines?.length) {
    writeJSON(PROFILE_KEY, { ...profile, deadlines: [] })
  }
  writeJSON(
    COMPLETED_KEY,
    readJSON<string[]>(COMPLETED_KEY, []).filter((id) => !id.startsWith("deadline-"))
  )
  writeJSON(DEADLINES_RESET_KEY, DEADLINES_RESET_VERSION)
}

export function saveProfile(profile: ObligationsProfile) {
  writeJSON(PROFILE_KEY, profile)
}

export function updateProfile(patch: Partial<ObligationsProfile>) {
  const current = loadProfile()
  if (!current) return null

  const next = { ...current, ...patch }
  saveProfile(next)
  return next
}

export function clearAllData() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(PROFILE_KEY)
  window.localStorage.removeItem(PAYMENTS_KEY)
  window.localStorage.removeItem(COMPLETED_KEY)
}

export function loadPayments(): Payment[] {
  return readJSON<Payment[]>(PAYMENTS_KEY, [])
}

export function addPayment(payment: Payment) {
  const payments = loadPayments()
  writeJSON(PAYMENTS_KEY, [payment, ...payments])
}

export function loadCompletedOccurrenceIds(): string[] {
  return readJSON<string[]>(COMPLETED_KEY, [])
}

export function setOccurrenceCompleted(id: string, done: boolean) {
  const ids = new Set(loadCompletedOccurrenceIds())
  if (done) ids.add(id)
  else ids.delete(id)
  writeJSON(COMPLETED_KEY, [...ids])
}

export function toggleOccurrenceCompleted(id: string) {
  const ids = new Set(loadCompletedOccurrenceIds())
  if (ids.has(id)) {
    ids.delete(id)
  } else {
    ids.add(id)
  }
  writeJSON(COMPLETED_KEY, [...ids])
  return ids.has(id)
}

export { emptyProfile }
