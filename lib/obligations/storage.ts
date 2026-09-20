import { emptyProfile, type ObligationsProfile, type Payment } from "./types"

const PROFILE_KEY = "true-roof:obligations:v1"
const PAYMENTS_KEY = "true-roof:payments:v1"
const COMPLETED_KEY = "true-roof:completed-occurrences:v1"

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
  return readJSON<ObligationsProfile | null>(PROFILE_KEY, null)
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
