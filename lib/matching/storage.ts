import {
  householdValues,
  idStatusValues,
  partnerRoomsValues,
  petNeedValues,
  vehicleNeedValues,
  vehicleRegisteredValues,
  vehicleSizeValues,
  type SeekerNeeds,
} from "./needs"
import { isHHMM } from "./time"

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
//
// This validates enum MEMBERSHIP, not just typeof. A blob holding
// pet: "dog" used to pass, which made petLabel["dog"] render as undefined and,
// worse, made the lookup tables in lib/matching/vocabulary.ts return undefined.
// An undefined verdict is neither "fits" nor "excluded", so a single bad value
// could quietly change what the whole feed shows. Rejecting the blob means the
// person answers ten questions again, which is far better than being shown
// places that do not fit without knowing it.
function oneOf<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return (
    typeof value === "string" && (values as readonly string[]).includes(value)
  )
}

function isNeeds(value: unknown): value is SeekerNeeds {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>

  if (!oneOf(householdValues, v.household)) return false
  if (!oneOf(petNeedValues, v.pet)) return false
  if (!oneOf(idStatusValues, v.idStatus)) return false
  if (!oneOf(vehicleNeedValues, v.vehicle)) return false

  // Nullable follow-ups: null is valid, a wrong string is not.
  if (v.partnerRooms !== null && !oneOf(partnerRoomsValues, v.partnerRooms)) {
    return false
  }
  if (v.vehicleSize !== null && !oneOf(vehicleSizeValues, v.vehicleSize)) {
    return false
  }
  if (
    v.vehicleRegistered !== null &&
    !oneOf(vehicleRegisteredValues, v.vehicleRegistered)
  ) {
    return false
  }

  // Times, matching what the questionnaire collects.
  if (!isHHMM(v.arrivalFrom) || !isHHMM(v.arrivalTo)) return false
  if (v.latestEntry !== null && !isHHMM(v.latestEntry)) return false

  // Ranges, matching the form's own validation.
  if (
    v.petWeightLbs !== null &&
    (typeof v.petWeightLbs !== "number" ||
      !Number.isFinite(v.petWeightLbs) ||
      v.petWeightLbs < 1 ||
      v.petWeightLbs > 200)
  ) {
    return false
  }
  if (
    typeof v.daysNeeded !== "number" ||
    !Number.isFinite(v.daysNeeded) ||
    v.daysNeeded < 1
  ) {
    return false
  }

  return true
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
