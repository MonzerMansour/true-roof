import { describe, expect, it } from "vitest"

import {
  normalizeTranscript,
  proposeAnswer,
  voiceFieldOptions as allowed,
  type VoiceField,
} from "@/lib/voice/answer-rules"

describe("proposeAnswer never invents an option", () => {
  it("only ever proposes a real member of the field's enum", () => {
    // Rule 1. A value that is not on the screen must never come back, however
    // the sentence is phrased.
    const noise = [
      "um I guess maybe",
      "a dog I think probably",
      "my partner and also a cat and a van",
      "asdf qwerty",
      "",
      "   ",
      "NO ID!!! none whatsoever",
    ]
    for (const field of Object.keys(allowed) as VoiceField[]) {
      for (const text of noise) {
        const result = proposeAnswer(field, text)
        if (result.value !== null) {
          expect(allowed[field], `${field} <- "${text}"`).toContain(
            result.value
          )
        }
      }
    }
  })

  it("returns the transcript even when nothing matches", () => {
    // Seeing what was heard is useful on its own: it tells someone whether to
    // say it differently or stop trying and tap.
    const result = proposeAnswer("pet", "the weather is quite nice today")
    expect(result.value).toBeNull()
    expect(result.transcript).toBe("the weather is quite nice today")
  })

  it("handles empty and whitespace-only audio without throwing", () => {
    expect(proposeAnswer("household", "").value).toBeNull()
    expect(proposeAnswer("household", "   ").value).toBeNull()
  })
})

describe("household", () => {
  it("hears a partner", () => {
    for (const said of [
      "me and my partner",
      "my husband is with me",
      "there's two of us",
      "we're together",
    ]) {
      expect(proposeAnswer("household", said).value, said).toBe("with_partner")
    }
  })

  it("hears someone on their own", () => {
    for (const said of ["just me", "by myself", "I'm alone", "only me"]) {
      expect(proposeAnswer("household", said).value, said).toBe("alone")
    }
  })
})

describe("pet", () => {
  it("puts a service animal above the generic dog rule", () => {
    // Ordering matters: "service dog" must not fall through to "dog".
    expect(proposeAnswer("pet", "I have a service dog").value).toBe(
      "service_animal"
    )
    expect(proposeAnswer("pet", "a guide dog").value).toBe("service_animal")
  })

  it("separates a large dog from a small one", () => {
    expect(proposeAnswer("pet", "a big dog").value).toBe("larger_pet")
    expect(proposeAnswer("pet", "I have a small dog").value).toBe("small_pet")
    expect(proposeAnswer("pet", "just a cat").value).toBe("small_pet")
  })

  it("hears no pet", () => {
    expect(proposeAnswer("pet", "no pets").value).toBe("none")
    expect(proposeAnswer("pet", "I don't have a pet").value).toBe("none")
  })
})

describe("id", () => {
  it("separates having, not having, and getting one", () => {
    expect(proposeAnswer("id", "I have my id").value).toBe("have_id")
    expect(proposeAnswer("id", "no id, it was stolen").value).toBe("no_id")
    expect(proposeAnswer("id", "I applied for one last week").value).toBe(
      "in_progress"
    )
  })

  it("does not read 'no id' as having one", () => {
    // The pair that matters most: getting this backwards sends someone with no
    // ID to a site that requires it.
    const result = proposeAnswer("id", "I do not have id")
    expect(result.value).toBe("no_id")
  })
})

describe("vehicle", () => {
  it("separates an RV from a car from nothing", () => {
    expect(proposeAnswer("vehicle", "I live in my van").value).toBe("rv_van")
    expect(proposeAnswer("vehicle", "I have a car").value).toBe("car")
    expect(proposeAnswer("vehicle", "no car, I'm walking").value).toBe("none")
  })
})

describe("word boundaries", () => {
  it("does not fire on a word inside another word", () => {
    // "none" inside "nonetheless", "no" inside "nowhere".
    expect(proposeAnswer("pet", "nonetheless it was fine").value).not.toBe(
      "none"
    )
    expect(proposeAnswer("vehicleRegistered", "nowhere to go").value).not.toBe(
      "no"
    )
  })
})

describe("normalizeTranscript", () => {
  it("strips punctuation and collapses whitespace, keeping apostrophes", () => {
    expect(normalizeTranscript("  No ID!!!  It's   gone. ")).toBe(
      "no id it's gone"
    )
  })
})
