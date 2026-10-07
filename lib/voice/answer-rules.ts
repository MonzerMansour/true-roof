// Turns a transcript into a PROPOSED answer, and nothing more.
//
// Same split as the letter reader: readScan() reads, checkScan() decides. Here
// transcribe() reads and this file decides, with two rules it never breaks.
//
//   1. A proposal must be a real member of the enum for that question. A model
//      returning "maybe a dog" does not become an answer; it becomes nothing.
//   2. Nothing is ever applied on its own. Every proposal goes back to the
//      person with the words they said, and they tap to confirm it.
//
// Matching on plain words rather than asking a model to classify is deliberate.
// These are ten short, closed questions with a handful of valid answers each.
// A word list is auditable, free, instant, works with the network off once the
// transcript exists, and cannot invent an option that is not on the screen.

import type {
  Household,
  IdStatus,
  PartnerRooms,
  PetNeed,
  VehicleNeed,
  VehicleRegistered,
  VehicleSize,
} from "@/lib/matching/needs"

export type VoiceField =
  | "household"
  | "partnerRooms"
  | "pet"
  | "id"
  | "vehicle"
  | "vehicleSize"
  | "vehicleRegistered"

export type VoiceProposal = {
  /** Exactly what was heard. Always shown, so the person can see whether they
   * were understood before anything is applied. */
  transcript: string
  /** The option this maps to, or null when nothing matched confidently. */
  value: string | null
  /** The matching phrase, so the UI can say why it proposed this. */
  matched: string | null
}

/** Phrases that map to an option. Order matters: the first match wins, so put
 * the more specific phrase first ("no id" before "id"). */
type Rule = { value: string; phrases: string[] }

const RULES: Record<VoiceField, Rule[]> = {
  household: [
    {
      value: "with_partner",
      phrases: [
        "my partner",
        "with my partner",
        "me and my",
        "my husband",
        "my wife",
        "my boyfriend",
        "my girlfriend",
        "my spouse",
        "two of us",
        "both of us",
        "we are",
        "we're",
      ],
    },
    {
      value: "alone",
      phrases: [
        "just me",
        "by myself",
        "on my own",
        "alone",
        "only me",
        "myself",
        "one person",
      ],
    },
  ],
  partnerRooms: [
    {
      value: "either",
      phrases: [
        "either",
        "don't mind",
        "do not mind",
        "whatever",
        "no preference",
      ],
    },
    {
      value: "same_room",
      phrases: [
        "same room",
        "together",
        "stay together",
        "with them",
        "one room",
      ],
    },
    {
      value: "separate_rooms",
      phrases: ["separate", "different room", "apart", "two rooms"],
    },
  ],
  pet: [
    {
      value: "service_animal",
      phrases: ["service animal", "service dog", "guide dog", "assistance dog"],
    },
    {
      value: "larger_pet",
      phrases: [
        "big dog",
        "large dog",
        "big pet",
        "large pet",
        "german shepherd",
        "pit bull",
        "labrador",
        "retriever",
      ],
    },
    {
      value: "small_pet",
      phrases: [
        "small dog",
        "small pet",
        "cat",
        "puppy",
        "kitten",
        "little dog",
        "small animal",
      ],
    },
    {
      value: "none",
      phrases: [
        "no pet",
        "no pets",
        "don't have a pet",
        "do not have a pet",
        "no animal",
        "none",
      ],
    },
    // Bare "dog" is last: it would otherwise swallow "small dog" and "service
    // dog" above. Unqualified, it cannot tell us the size, so it is a weak
    // match the person still has to confirm.
    { value: "small_pet", phrases: ["dog", "pet"] },
  ],
  id: [
    {
      value: "in_progress",
      phrases: [
        "getting one",
        "applied for",
        "waiting for",
        "in progress",
        "on the way",
        "replacing",
      ],
    },
    {
      value: "no_id",
      phrases: [
        "no id",
        "don't have id",
        "do not have id",
        "lost my id",
        "stolen",
        "haven't got",
        "no identification",
      ],
    },
    {
      value: "have_id",
      phrases: [
        "i have id",
        "yes i have",
        "got my id",
        "have my id",
        "driver's license",
        "drivers license",
        "have one",
      ],
    },
  ],
  vehicle: [
    {
      value: "rv_van",
      phrases: [
        "rv",
        "r v",
        "motorhome",
        "motor home",
        "van",
        "camper",
        "trailer",
      ],
    },
    {
      value: "car",
      phrases: ["a car", "my car", "truck", "suv", "sedan", "vehicle"],
    },
    {
      value: "none",
      phrases: [
        "no car",
        "no vehicle",
        "don't have a car",
        "do not have a car",
        "walking",
        "on foot",
        "none",
      ],
    },
  ],
  vehicleSize: [
    {
      value: "large",
      phrases: [
        "large",
        "big",
        "long",
        "oversized",
        "doesn't fit",
        "does not fit",
      ],
    },
    {
      value: "standard",
      phrases: ["standard", "normal", "regular", "fits", "small"],
    },
  ],
  vehicleRegistered: [
    {
      value: "not_sure",
      phrases: ["not sure", "don't know", "do not know", "maybe", "unsure"],
    },
    {
      value: "no",
      phrases: ["no", "not registered", "expired", "it's expired", "lapsed"],
    },
    {
      value: "yes",
      phrases: [
        "yes",
        "registered",
        "it runs",
        "runs fine",
        "up to date",
        "current",
      ],
    },
  ],
}

// Every option each field will accept, enumerable at runtime.
//
// lib/matching/needs.ts declares these as plain union types, which TypeScript
// erases, so there is nothing to check against at runtime. Writing them as
// Record<Union, true> makes the compiler do the checking instead: miss a
// member and it fails to compile, add one that is not in the union and it
// fails too. So this list cannot silently drift from the questionnaire.
const householdSet = { alone: true, with_partner: true } satisfies Record<
  Household,
  true
>
const partnerRoomsSet = {
  same_room: true,
  separate_rooms: true,
  either: true,
} satisfies Record<PartnerRooms, true>
const petSet = {
  none: true,
  service_animal: true,
  small_pet: true,
  larger_pet: true,
} satisfies Record<PetNeed, true>
const idSet = {
  have_id: true,
  no_id: true,
  in_progress: true,
} satisfies Record<IdStatus, true>
const vehicleSet = {
  none: true,
  car: true,
  rv_van: true,
} satisfies Record<VehicleNeed, true>
const vehicleSizeSet = {
  standard: true,
  large: true,
} satisfies Record<VehicleSize, true>
const vehicleRegisteredSet = {
  yes: true,
  no: true,
  not_sure: true,
} satisfies Record<VehicleRegistered, true>

/** A proposal is checked against this, so a rule with a typo in its value
 * produces nothing rather than a bad answer. */
const ALLOWED: Record<VoiceField, readonly string[]> = {
  household: Object.keys(householdSet),
  partnerRooms: Object.keys(partnerRoomsSet),
  pet: Object.keys(petSet),
  id: Object.keys(idSet),
  vehicle: Object.keys(vehicleSet),
  vehicleSize: Object.keys(vehicleSizeSet),
  vehicleRegistered: Object.keys(vehicleRegisteredSet),
}

export const voiceFieldOptions = ALLOWED

export function normalizeTranscript(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Proposes an answer. Never applies one.
 *
 * Returns the transcript even when nothing matches, because seeing what was
 * heard is useful on its own: it tells someone whether to say it differently
 * or give up and tap.
 */
export function proposeAnswer(
  field: VoiceField,
  transcript: string
): VoiceProposal {
  const text = normalizeTranscript(transcript)
  if (!text)
    return { transcript: transcript.trim(), value: null, matched: null }

  for (const rule of RULES[field]) {
    for (const phrase of rule.phrases) {
      // Word-boundary match, so "none" does not fire inside "nonetheless" and
      // "no" does not fire inside "nowhere".
      const pattern = new RegExp(
        `(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`,
        "i"
      )
      if (pattern.test(text)) {
        // Rule 1: the value must be a real option for this field.
        const value = ALLOWED[field].includes(rule.value) ? rule.value : null
        return { transcript: transcript.trim(), value, matched: phrase }
      }
    }
  }

  return { transcript: transcript.trim(), value: null, matched: null }
}
