import type { RiskLevel } from "@/lib/obligations/schedule"
import type { Occurrence } from "@/lib/obligations/types"

export const ALERT_EMAIL_OPT_IN_KEY = "true-roof:alert-email-opt-in:v1"
export const ALERT_EMAIL_SENT_KEY = "true-roof:alert-email-sent:v1"

/** Days overdue before we treat a single item as critically late. */
export const CRITICAL_OVERDUE_DAYS = 3

type SentRecord = {
  fingerprint: string
  sentAt: string
}

export function loadAlertEmailOptIn(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(ALERT_EMAIL_OPT_IN_KEY) === "1"
  } catch {
    return false
  }
}

export function saveAlertEmailOptIn(enabled: boolean) {
  if (typeof window === "undefined") return
  try {
    if (enabled) {
      window.localStorage.setItem(ALERT_EMAIL_OPT_IN_KEY, "1")
    } else {
      window.localStorage.removeItem(ALERT_EMAIL_OPT_IN_KEY)
    }
  } catch {
    // Storage blocked. Prefer staying quiet over crashing Financials.
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function parseLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function overdueIdsPast(
  occurrences: Occurrence[],
  completedIds: string[],
  minDays: number,
  now = new Date()
) {
  const completed = new Set(completedIds)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ids: string[] = []

  for (const occurrence of occurrences) {
    if (completed.has(occurrence.id)) continue
    const date = parseLocalDate(occurrence.date)
    if (!date) continue
    const days =
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    if (days >= minDays) ids.push(occurrence.id)
  }

  return ids
}

export function criticallyOverdueIds(
  occurrences: Occurrence[],
  completedIds: string[],
  now = new Date()
) {
  return overdueIdsPast(occurrences, completedIds, CRITICAL_OVERDUE_DAYS, now)
}

export function overdueOccurrenceIds(
  occurrences: Occurrence[],
  completedIds: string[],
  now = new Date()
) {
  return overdueIdsPast(occurrences, completedIds, 1, now)
}

export function shouldOfferLateAlert(level: RiskLevel, criticalIds: string[]) {
  return level === "act" || criticalIds.length > 0
}

export function alertFingerprint(level: RiskLevel, occurrenceIds: string[]) {
  const ids = [...occurrenceIds].sort().join(",")
  return `${todayIso()}|${level}|${ids}`
}

function loadSent(): SentRecord | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(ALERT_EMAIL_SENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SentRecord
    if (
      typeof parsed?.fingerprint !== "string" ||
      typeof parsed?.sentAt !== "string"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function markSent(fingerprint: string) {
  if (typeof window === "undefined") return
  try {
    const record: SentRecord = {
      fingerprint,
      sentAt: new Date().toISOString(),
    }
    window.localStorage.setItem(ALERT_EMAIL_SENT_KEY, JSON.stringify(record))
  } catch {
    // Ignore.
  }
}

/**
 * Plan A: when the signed-in person opens Financials (or home) and risk is
 * Act or critically overdue, email them once per fingerprint per day.
 */
export async function maybeSendLateAlertEmail({
  level,
  reasons,
  occurrenceIds,
}: {
  level: RiskLevel
  reasons: string[]
  occurrenceIds: string[]
}): Promise<"sent" | "skipped" | "failed"> {
  if (typeof window === "undefined") return "skipped"
  if (!loadAlertEmailOptIn()) return "skipped"
  if (!shouldOfferLateAlert(level, occurrenceIds)) return "skipped"

  const fingerprint = alertFingerprint(level, occurrenceIds)
  const previous = loadSent()
  if (previous?.fingerprint === fingerprint) return "skipped"

  try {
    const res = await fetch("/api/alerts/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        reasons: reasons.slice(0, 4),
        occurrenceIds: occurrenceIds.slice(0, 24),
      }),
    })
    if (!res.ok) return "failed"
    markSent(fingerprint)
    return "sent"
  } catch {
    return "failed"
  }
}
