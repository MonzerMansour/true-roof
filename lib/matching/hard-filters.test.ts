import { describe, expect, it } from "vitest"

import type { Listing } from "@/lib/listings/types"
import { listingFitsNeeds } from "@/lib/matching/hard-filters"
import type { SeekerNeeds } from "@/lib/matching/needs"

/** A fully published shelter. Every rule set, so a test only has to state the
 * one field it cares about. Real rows are mostly null, which is covered
 * separately below. */
function shelter(over: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    name: "Test Shelter",
    kind: "shelter",
    freshness: "live",
    lastConfirmedAt: new Date().toISOString(),
    pets: "any",
    couples: "same_room",
    parkingStatus: null,
    vehicleNote: null,
    city: "San Jose",
    orgName: "Test Org",
    orgDescription: null,
    address: "1 Test St",
    lat: 37.3382,
    lng: -121.8863,
    phone: "+14085550100",
    intakeMethod: "register",
    idRequired: "not_required",
    curfewPolicy: "no_curfew",
    curfewTime: null,
    intakeFrom: "00:00",
    intakeTo: "23:59",
    maxStay: "no_limit",
    petWeightLimitLbs: null,
    vehicleAllowed: null,
    vehicleMaxLengthFt: null,
    registrationRequired: null,
    projectType: "emergency_shelter",
    totalBeds: 40,
    dataSource: "provider_portal",
    sourceUrl: null,
    sourceAsOf: "2026-09-26",
    ...over,
  }
}

function lot(over: Partial<Listing> = {}): Listing {
  return shelter({
    id: "lot-1",
    name: "Test Lot",
    kind: "parking",
    pets: null,
    couples: null,
    parkingStatus: "open",
    vehicleAllowed: "car_van_rv",
    registrationRequired: "not_required",
    ...over,
  })
}

/** Someone with no constraints at all. */
function needs(over: Partial<SeekerNeeds> = {}): SeekerNeeds {
  return {
    household: "alone",
    partnerRooms: null,
    pet: "none",
    petWeightLbs: null,
    idStatus: "have_id",
    vehicle: "none",
    vehicleSize: null,
    vehicleRegistered: null,
    arrivalFrom: "00:00",
    arrivalTo: "23:59",
    latestEntry: null,
    daysNeeded: 1,
    ...over,
  }
}

describe("no answers saved", () => {
  it("keeps everything", () => {
    const fit = listingFitsNeeds(shelter(), null)
    expect(fit.verdict).toBe("fits")
    expect(fit.fits).toBe(true)
  })
})

// The sample profiles.

describe("profile: has a larger pet", () => {
  const withDog = needs({ pet: "larger_pet" })

  it("is excluded from a no-pets shelter", () => {
    const fit = listingFitsNeeds(shelter({ pets: "not_allowed" }), withDog)
    expect(fit.verdict).toBe("excluded")
    expect(fit.fits).toBe(false)
    expect(fit.reasons[0]).toContain("larger pet")
  })

  it("is excluded from a small-pets-only shelter", () => {
    expect(
      listingFitsNeeds(shelter({ pets: "small_pets" }), withDog).verdict
    ).toBe("excluded")
  })

  it("fits a shelter that takes any pet", () => {
    expect(listingFitsNeeds(shelter({ pets: "any" }), withDog).verdict).toBe(
      "fits"
    )
  })

  it("is NOT excluded when the shelter has published no pet policy", () => {
    // This is the single most important case in the file. Most real rows come
    // from HUD's county bed count, which publishes no pet policy at all. If
    // null excluded, the feed would be empty for anyone with a dog.
    const fit = listingFitsNeeds(shelter({ pets: null }), withDog)
    expect(fit.verdict).toBe("unknown")
    expect(fit.fits).toBe(true)
    expect(fit.unknowns).toContain("pets")
  })
})

describe("profile: service animal", () => {
  const withServiceAnimal = needs({ pet: "service_animal" })

  it("is never excluded, even by a no-pets policy", () => {
    // A service animal is not a pet, and under the ADA generally has to be
    // allowed. Excluding would hide a bed the person has a right to.
    const fit = listingFitsNeeds(
      shelter({ pets: "not_allowed" }),
      withServiceAnimal
    )
    expect(fit.verdict).not.toBe("excluded")
    expect(fit.fits).toBe(true)
    expect(fit.notes.join(" ")).toContain("service animal is not a pet")
  })

  it("fits a service-animals-only shelter outright", () => {
    expect(
      listingFitsNeeds(shelter({ pets: "service_only" }), withServiceAnimal)
        .verdict
    ).toBe("fits")
  })
})

describe("profile: small pet with a weight", () => {
  it("is excluded when it is over the published limit", () => {
    const fit = listingFitsNeeds(
      shelter({ pets: "small_pets", petWeightLimitLbs: 20 }),
      needs({ pet: "small_pet", petWeightLbs: 35 })
    )
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons[0]).toContain("20 lb")
  })

  it("fits when it is under the limit", () => {
    expect(
      listingFitsNeeds(
        shelter({ pets: "small_pets", petWeightLimitLbs: 20 }),
        needs({ pet: "small_pet", petWeightLbs: 12 })
      ).verdict
    ).toBe("fits")
  })

  it("is not excluded when the limit is unpublished", () => {
    const fit = listingFitsNeeds(
      shelter({ pets: "small_pets", petWeightLimitLbs: null }),
      needs({ pet: "small_pet", petWeightLbs: 35 })
    )
    expect(fit.fits).toBe(true)
    expect(fit.unknowns).toContain("petWeightLimitLbs")
  })
})

describe("profile: no ID", () => {
  const noId = needs({ idStatus: "no_id" })

  it("is excluded from a shelter that requires ID", () => {
    const fit = listingFitsNeeds(shelter({ idRequired: "required" }), noId)
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons[0]).toContain("photo ID")
  })

  it("fits a shelter that does not require ID", () => {
    expect(
      listingFitsNeeds(shelter({ idRequired: "not_required" }), noId).verdict
    ).toBe("fits")
  })

  it("is kept, with a note, when the shelter decides case by case", () => {
    const fit = listingFitsNeeds(shelter({ idRequired: "case_by_case" }), noId)
    expect(fit.fits).toBe(true)
    expect(fit.notes.join(" ")).toContain("case by case")
  })

  it("is not excluded when the ID rule is unpublished", () => {
    const fit = listingFitsNeeds(shelter({ idRequired: null }), noId)
    expect(fit.fits).toBe(true)
    expect(fit.unknowns).toContain("idRequired")
  })

  it("does not affect someone who has ID", () => {
    expect(
      listingFitsNeeds(shelter({ idRequired: "required" }), needs()).verdict
    ).toBe("fits")
  })
})

describe("profile: has a vehicle", () => {
  it("excludes someone with no vehicle from a parking lot", () => {
    const fit = listingFitsNeeds(lot(), needs({ vehicle: "none" }))
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons[0]).toContain("sleeping in a car or RV")
  })

  it("excludes an RV from a cars-only lot", () => {
    const fit = listingFitsNeeds(
      lot({ vehicleAllowed: "car_only" }),
      needs({ vehicle: "rv_van", vehicleSize: "large" })
    )
    expect(fit.verdict).toBe("excluded")
  })

  it("keeps an RV at a cars-and-vans lot, with a note", () => {
    // The questionnaire asks one question covering RV and van, so this is
    // genuinely undecidable rather than a mismatch.
    const fit = listingFitsNeeds(
      lot({ vehicleAllowed: "car_van" }),
      needs({ vehicle: "rv_van" })
    )
    expect(fit.fits).toBe(true)
    expect(fit.notes.join(" ")).toContain("vans but not RVs")
  })

  it("excludes an unregistered vehicle from a lot that requires registration", () => {
    const fit = listingFitsNeeds(
      lot({ registrationRequired: "required" }),
      needs({ vehicle: "car", vehicleRegistered: "no" })
    )
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons[0]).toContain("registration")
  })

  it("keeps an unregistered vehicle where registration is not required", () => {
    expect(
      listingFitsNeeds(
        lot({ registrationRequired: "not_required" }),
        needs({ vehicle: "car", vehicleRegistered: "no" })
      ).verdict
    ).toBe("fits")
  })

  it("excludes a full lot", () => {
    const fit = listingFitsNeeds(
      lot({ parkingStatus: "full" }),
      needs({ vehicle: "car" })
    )
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons).toContain("This lot is full.")
  })
})

describe("profile: couple", () => {
  it("is excluded from a shelter that does not take couples", () => {
    const fit = listingFitsNeeds(
      shelter({ couples: "not_allowed" }),
      needs({ household: "with_partner", partnerRooms: "same_room" })
    )
    expect(fit.verdict).toBe("excluded")
  })

  it("is excluded from separate rooms when they need the same room", () => {
    expect(
      listingFitsNeeds(
        shelter({ couples: "separate_rooms" }),
        needs({ household: "with_partner", partnerRooms: "same_room" })
      ).verdict
    ).toBe("excluded")
  })

  it("fits either layout when either works", () => {
    for (const couples of ["same_room", "separate_rooms"] as const) {
      expect(
        listingFitsNeeds(
          shelter({ couples }),
          needs({ household: "with_partner", partnerRooms: "either" })
        ).verdict
      ).toBe("fits")
    }
  })

  it("treats a missing partnerRooms as either works", () => {
    // Unreachable through the form, but a stale stored blob can produce it.
    expect(
      listingFitsNeeds(
        shelter({ couples: "same_room" }),
        needs({ household: "with_partner", partnerRooms: null })
      ).verdict
    ).toBe("fits")
  })
})

describe("check-in window", () => {
  it("excludes when the windows do not overlap", () => {
    const fit = listingFitsNeeds(
      shelter({ intakeFrom: "09:00", intakeTo: "17:00" }),
      needs({ arrivalFrom: "20:00", arrivalTo: "23:00" })
    )
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons[0]).toContain("Check-in is")
  })

  it("handles a window that wraps past midnight", () => {
    // The real Mountain View overnight lots are 7pm to 7am. A naive comparison
    // says these are never open.
    const overnight = shelter({ intakeFrom: "19:00", intakeTo: "07:00" })
    expect(
      listingFitsNeeds(
        overnight,
        needs({ arrivalFrom: "22:00", arrivalTo: "23:30" })
      ).verdict
    ).toBe("fits")
    expect(
      listingFitsNeeds(
        overnight,
        needs({ arrivalFrom: "02:00", arrivalTo: "04:00" })
      ).verdict
    ).toBe("fits")
    expect(
      listingFitsNeeds(
        overnight,
        needs({ arrivalFrom: "09:00", arrivalTo: "17:00" })
      ).verdict
    ).toBe("excluded")
  })
})

describe("curfew", () => {
  it("excludes when the doors lock before they can arrive", () => {
    const fit = listingFitsNeeds(
      shelter({ curfewPolicy: "fixed_time", curfewTime: "21:00" }),
      needs({ latestEntry: "23:00" })
    )
    expect(fit.verdict).toBe("excluded")
    expect(fit.reasons[0]).toContain("Doors lock")
  })

  it("fits when the curfew is later than they need", () => {
    expect(
      listingFitsNeeds(
        shelter({ curfewPolicy: "fixed_time", curfewTime: "23:00" }),
        needs({ latestEntry: "21:00" })
      ).verdict
    ).toBe("fits")
  })

  it("treats midnight as the end of the night, not the start", () => {
    // "Midnight or later" is stored as 00:00. Compared naively it looks like
    // the earliest time of day and would match every curfew.
    expect(
      listingFitsNeeds(
        shelter({ curfewPolicy: "fixed_time", curfewTime: "22:00" }),
        needs({ latestEntry: "00:00" })
      ).verdict
    ).toBe("excluded")
  })

  it("never excludes when the site says it has no curfew", () => {
    expect(
      listingFitsNeeds(
        shelter({ curfewPolicy: "no_curfew", curfewTime: null }),
        needs({ latestEntry: "00:00" })
      ).verdict
    ).toBe("fits")
  })

  it("never excludes when the curfew is unpublished", () => {
    const fit = listingFitsNeeds(
      shelter({ curfewPolicy: null, curfewTime: null }),
      needs({ latestEntry: "23:00" })
    )
    expect(fit.fits).toBe(true)
    expect(fit.unknowns).toContain("curfew")
  })
})

describe("max stay", () => {
  it("never excludes, even when far too short", () => {
    // Someone who needs 90 nights still needs tonight. Hiding the one night
    // mat would leave them outside.
    const fit = listingFitsNeeds(
      shelter({ maxStay: "one_night" }),
      needs({ daysNeeded: 90 })
    )
    expect(fit.fits).toBe(true)
    expect(fit.reasons).toHaveLength(0)
    expect(fit.notes.join(" ")).toContain("shorter than you asked for")
  })

  it("says nothing when the stay is long enough", () => {
    const fit = listingFitsNeeds(
      shelter({ maxStay: "up_to_180_nights" }),
      needs({ daysNeeded: 90 })
    )
    expect(fit.notes).toHaveLength(0)
  })
})

describe("a real HUD sourced row, with nothing published", () => {
  const hudRow = shelter({
    pets: null,
    couples: null,
    idRequired: null,
    curfewPolicy: null,
    curfewTime: null,
    intakeFrom: null,
    intakeTo: null,
    maxStay: null,
    address: null,
    phone: null,
    lat: null,
    lng: null,
    freshness: "call_first",
    dataSource: "hud_hic_2025",
  })

  it("is kept for the hardest profile there is, and names every gap", () => {
    // Somebody with a large dog, no ID, a partner, and a late arrival. Nothing
    // about this row contradicts any of it, because the row says nothing. The
    // honest answer is to show it and list what needs a phone call.
    const fit = listingFitsNeeds(
      hudRow,
      needs({
        pet: "larger_pet",
        idStatus: "no_id",
        household: "with_partner",
        partnerRooms: "same_room",
        latestEntry: "23:00",
        daysNeeded: 30,
      })
    )

    expect(fit.verdict).toBe("unknown")
    expect(fit.fits).toBe(true)
    expect(fit.reasons).toHaveLength(0)
    expect(fit.unknowns).toEqual(
      expect.arrayContaining([
        "pets",
        "couples",
        "idRequired",
        "curfew",
        "intakeWindow",
        "maxStay",
      ])
    )
  })
})
