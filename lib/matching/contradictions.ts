import type { Listing } from "@/lib/listings/types"
import type { SeekerNeeds } from "@/lib/matching/needs"

// Finds where the two sides say opposite things, in words as well as in the
// structured answers. Embeddings score "no pets" and "I have a dog" as close,
// because they are about the same thing; this is the part that notices one of
// them says no.
//
// Display and scoring only. It never hides a listing: hard-filters.ts is the
// only thing that does. A contradiction lowers the match percent sharply and
// is shown to the person with the reason.

export type Topic =
  | "pets"
  | "partner"
  | "children"
  | "smoking"
  | "wheelchair"
  | "curfew"
  | "shared_room"

export type Contradiction = {
  topic: Topic
  /** Plain sentence for the person, written to them as "you". */
  detail: string
}

const TOPIC_WORDS: Record<Topic, RegExp> = {
  pets: /\b(pets?|dogs?|cats?|pupp(y|ies)|kittens?|animals?)\b/,
  partner: /\b(partners?|boyfriend|girlfriend|husband|wife|spouse|couples?)\b/,
  children: /\b(kids?|child|children|sons?|daughters?|bab(y|ies)|famil(y|ies))\b/,
  smoking: /\b(smok\w*|cigarettes?|vap(e|es|ing))\b/,
  wheelchair: /\b(wheelchairs?|ada|mobility aids?|walkers?)\b/,
  curfew: /\bcurfews?\b/,
  shared_room: /\b(shared rooms?|shared spaces?|dorms?|dormitor(y|ies)|bunks?|bunk beds?|congregate)\b/,
}

// Words that turn a mention into a "no". Checked per clause, so "pets
// welcome, no smoking" says yes to pets and no to smoking.
const NEGATION =
  /\b(no|not|never|without|none|cannot|can't|cant|won't|wont|don't|dont|doesn't|doesnt|isn't|isnt|aren't|arent|prohibited|banned|forbidden)\b|n't\b|-free\b/

export type Stances = { yes: Set<Topic>; no: Set<Topic> }

/** What a piece of free text says yes and no to, topic by topic. */
export function readStances(text: string | null | undefined): Stances {
  const stances: Stances = { yes: new Set(), no: new Set() }
  if (!text?.trim()) return stances

  const cleaned = text
    .toLowerCase()
    // A place near a dog park says nothing about dogs.
    .replace(/\bdog parks?\b/g, "park")
    .replace(/[’]/g, "'")

  for (const clause of cleaned.split(/[.!?;,\n]|\bbut\b|\bhowever\b/)) {
    const negated = NEGATION.test(clause)
    for (const topic of Object.keys(TOPIC_WORDS) as Topic[]) {
      if (TOPIC_WORDS[topic].test(clause)) {
        ;(negated ? stances.no : stances.yes).add(topic)
      }
    }
  }

  return stances
}

const siteNoun: Record<Topic, string> = {
  pets: "pets",
  partner: "couples",
  children: "children",
  smoking: "smoking",
  wheelchair: "wheelchair access",
  curfew: "a curfew",
  shared_room: "shared rooms",
}

const personNeed: Record<Topic, string> = {
  pets: "room for your pet",
  partner: "to stay with your partner",
  children: "room for your children",
  smoking: "somewhere you can smoke",
  wheelchair: "wheelchair access",
  curfew: "a curfew",
  shared_room: "a shared room",
}

/**
 * Where the person and the site say opposite things, and at least one side
 * said it in its own words. Two structured answers that disagree (their pet
 * answer and the site's pet rule) are already scored in categorical-score.ts,
 * so they are not counted twice here.
 */
export function findContradictions(needs: SeekerNeeds, listing: Listing): Contradiction[] {
  const person = readStances(needs.placeNote)
  const site = readStances([listing.description, listing.orgDescription, listing.vehicleNote].filter(Boolean).join(". "))

  // Structured answers join in, marked so a structured-only clash is skipped.
  const personNeedsStructured = new Set<Topic>()
  if (needs.pet !== "none") personNeedsStructured.add("pets")
  if (needs.household === "with_partner") personNeedsStructured.add("partner")

  const siteForbidsStructured = new Set<Topic>()
  if (listing.pets === "not_allowed") siteForbidsStructured.add("pets")
  if (listing.couples === "not_allowed") siteForbidsStructured.add("partner")

  const found = new Map<Topic, Contradiction>()

  // They need something the site says no to.
  for (const topic of Object.keys(TOPIC_WORDS) as Topic[]) {
    const needsInWords = person.yes.has(topic)
    const needs_ = needsInWords || personNeedsStructured.has(topic)
    const forbidsInWords = site.no.has(topic)
    const forbids = forbidsInWords || siteForbidsStructured.has(topic)
    // "No curfew" on a site is good news, not a refusal: curfew is handled
    // the other way round below.
    if (topic === "curfew") continue
    if (needs_ && forbids && (needsInWords || forbidsInWords)) {
      found.set(topic, {
        topic,
        detail: `You need ${personNeed[topic]}, but this site says no ${siteNoun[topic].replace(/^a /, "")}.`,
      })
    }
  }

  // They said no to something the site says it has.
  for (const topic of person.no) {
    if (site.yes.has(topic) && !found.has(topic)) {
      found.set(topic, {
        topic,
        detail: `You said no ${siteNoun[topic].replace(/^a /, "")}, but this site mentions ${siteNoun[topic]}.`,
      })
    }
  }

  return [...found.values()]
}
