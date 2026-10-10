import { describe, expect, it } from "vitest"

import type { Listing } from "@/lib/listings/types"
import { categoricalAgreement } from "@/lib/matching/categorical-score"
import type { SeekerNeeds } from "@/lib/matching/needs"

function shelter(over: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    name: "Test Shelter",
    kind: "shelter",
    freshness: "live",
    lastConfirmedAt: new Date().toISOString(),
    pets: "any",
    couples: "same_room",
    parkingStatus: null,
    vehicleNote: null,
    city: "San Jose",
    orgName: "Org",
    orgDescription: null,
    address: null,
    lat: null,
    lng: null,
    phone: null,
    intakeMethod: "call",
    idRequired: null,
    curfewPolicy: null,
    curfewTime: null,
    intakeFrom: null,
    intakeTo: null,
    maxStay: null,
    petWeightLimitLbs: null,
    vehicleAllowed: null,
    vehicleMaxLengthFt: null,
    registrationRequired: null,
    projectType: null,
    totalBeds: null,
    dataSource: null,
    sourceUrl: null,
    sourceAsOf: null,
    externalRating: null,
    externalRatingCount: null,
    externalRatingSource: null,
    costNote: null,
    screeningNote: null,
    requiresDocuments: null,
    facilitiesNote: null,
    securityNote: null,
    maxStayNote: null,
    waitlistNote: null,
    petsNote: null,
    ...over,
  }
}

const lot = (over: Partial<Listing> = {}) =>
  shelter({
    kind: "parking",
    pets: null,
    couples: null,
    parkingStatus: "open",
    ...over,
  })

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
    arrivalFrom: "17:00",
    arrivalTo: "21:00",
    latestEntry: null,
    daysNeeded: 1,
    placeNote: "",
    ...over,
  } as SeekerNeeds
}

describe("categoricalAgreement", () => {
  it("always returns a score in 0..1 with at least one factor", () => {
    const cases: [SeekerNeeds, Listing][] = [
      [needs(), shelter()],
      [needs({ vehicle: "car" }), lot()],
      [needs({ pet: "larger_pet" }), shelter({ pets: "not_allowed" })],
      [
        needs({ household: "with_partner", partnerRooms: "same_room" }),
        shelter(),
      ],
      [needs({ vehicle: "rv_van" }), lot({ parkingStatus: "full" })],
    ]
    for (const [n, l] of cases) {
      const result = categoricalAgreement(n, l)
      expect(result.factors.length).toBeGreaterThan(0)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
      expect(Number.isFinite(result.score)).toBe(true)
    }
  })

  it("scores a clean match at the top", () => {
    const result = categoricalAgreement(needs(), shelter({ pets: "any" }))
    expect(result.score).toBe(1)
  })

  it("marks site type down when the person has a vehicle but this is indoors", () => {
    const withCar = categoricalAgreement(needs({ vehicle: "car" }), shelter())
    const withoutCar = categoricalAgreement(needs(), shelter())
    expect(withCar.score).toBeLessThan(withoutCar.score)
  })

  it("penalises a larger pet at a no-pets site", () => {
    const allowed = categoricalAgreement(
      needs({ pet: "larger_pet" }),
      shelter({ pets: "any" })
    )
    const refused = categoricalAgreement(
      needs({ pet: "larger_pet" }),
      shelter({ pets: "not_allowed" })
    )
    expect(refused.score).toBeLessThan(allowed.score)
  })

  it("ranks parking status open above waitlist above full", () => {
    const n = needs({ vehicle: "rv_van" })
    const open = categoricalAgreement(n, lot({ parkingStatus: "open" })).score
    const waitlist = categoricalAgreement(
      n,
      lot({ parkingStatus: "waitlist" })
    ).score
    const full = categoricalAgreement(n, lot({ parkingStatus: "full" })).score
    expect(open).toBeGreaterThan(waitlist)
    expect(waitlist).toBeGreaterThan(full)
  })

  // The interaction that matters most after the CA-500 import.
  describe("a HUD row, which publishes no policies at all", () => {
    const hudRow = shelter({
      pets: null,
      couples: null,
      parkingStatus: null,
      dataSource: "hud_hic_2025",
    })

    it("treats an unpublished pet policy as a midpoint, not a refusal", () => {
      const result = categoricalAgreement(needs({ pet: "larger_pet" }), hudRow)
      const pets = result.factors.find((f) => f.label === "Pets")
      expect(pets?.score).toBe(0.5)
      expect(pets?.detail).toContain("has not shared its pet rules")
    })

    it("lands near the midpoint regardless of what the person asked for", () => {
      // 91 of 92 real listings are HUD rows with null policies, so the
      // categorical half of the blend is close to constant across them and
      // cannot separate one from another. Cosine has to do that work. This
      // test documents the behaviour rather than asserting it is desirable.
      const picky = categoricalAgreement(
        needs({
          pet: "larger_pet",
          household: "with_partner",
          partnerRooms: "same_room",
        }),
        hudRow
      )
      const easy = categoricalAgreement(needs(), hudRow)
      expect(Math.abs(picky.score - easy.score)).toBeLessThan(0.3)
    })
  })
})

describe("details are written for the person reading them", () => {
  // Every detail is shown to the person on a Places card. A stored value like
  // "same_room" or a quoted code is unreadable there.
  const pets = ["none", "service_animal", "small_pet", "larger_pet"] as const
  const rooms = ["same_room", "separate_rooms", "either", null] as const
  const vehicles = ["none", "car"] as const
  const sitePets = ["not_allowed", "service_only", "small_pets", "any", null] as const
  const siteCouples = ["not_allowed", "same_room", "separate_rooms", null] as const
  const statuses = ["open", "full", "waitlist", null] as const

  it("never shows an underscore or a quote, for any combination", () => {
    for (const pet of pets)
      for (const partnerRooms of rooms)
        for (const vehicle of vehicles)
          for (const sitePet of sitePets)
            for (const couples of siteCouples)
              for (const kind of ["shelter", "parking"] as const)
                for (const parkingStatus of statuses) {
                  const result = categoricalAgreement(
                    needs({
                      pet,
                      household: partnerRooms ? "with_partner" : "alone",
                      partnerRooms,
                      vehicle,
                    } as Partial<SeekerNeeds>),
                    shelter({ kind, pets: sitePet, couples, parkingStatus })
                  )
                  for (const factor of result.factors) {
                    expect(factor.detail, factor.detail).not.toMatch(/[_"]/)
                  }
                }
  })

  it("says what the mismatch is in plain words", () => {
    const result = categoricalAgreement(
      needs({ household: "with_partner", partnerRooms: "same_room" } as Partial<SeekerNeeds>),
      shelter({ couples: "separate_rooms" })
    )
    expect(result.factors.find((f) => f.label === "Couples")?.detail).toBe(
      "You want to share a room, but this site puts couples in separate rooms."
    )
  })
})
