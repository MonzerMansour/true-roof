import type { IntakeMethod } from "@/lib/listings/types"

export type TesterExtras = {
  lat: number
  lng: number
  phone: string
  intakeMethod: IntakeMethod
}

/** Sample-site extras. Used by seed and when the live table has no coords yet. */
export const testerExtras: Record<string, TesterExtras> = {
  "a1e1c0a0-0b11-4c22-8d33-000000000001": {
    lat: 37.3394,
    lng: -121.892,
    phone: "+14085550101",
    intakeMethod: "register",
  },
  "a1e1c0a0-0b11-4c22-8d33-000000000002": {
    lat: 37.3305,
    lng: -121.9072,
    phone: "+14085550102",
    intakeMethod: "waitlist",
  },
  "a1e1c0a0-0b11-4c22-8d33-000000000003": {
    lat: 37.3472,
    lng: -121.8204,
    phone: "+14085550103",
    intakeMethod: "call",
  },
  "a1e1c0a0-0b11-4c22-8d33-000000000004": {
    lat: 37.3541,
    lng: -121.9552,
    phone: "+14085550104",
    intakeMethod: "walk_up",
  },
  "a1e1c0a0-0b11-4c22-8d33-000000000005": {
    lat: 37.3081,
    lng: -121.8474,
    phone: "+14085550105",
    intakeMethod: "register",
  },
  "a1e1c0a0-0b11-4c22-8d33-000000000006": {
    lat: 37.3234,
    lng: -121.9781,
    phone: "+14085550106",
    intakeMethod: "waitlist",
  },
}

export function extrasForListing(id: string) {
  return testerExtras[id] ?? null
}
