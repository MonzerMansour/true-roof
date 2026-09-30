import { describe, expect, it } from "vitest"

import {
  couplesOption,
  couplesPolicyValues,
  curfewPolicyOption,
  curfewPolicyValues,
  freshnessLabel,
  freshnessValues,
  idRequiredOption,
  idRequiredValues,
  intakeLabel,
  intakeMethodValues,
  maxStayOption,
  maxStayValues,
  parkingStatusLabel,
  parkingStatusValues,
  petsOption,
  petsPolicyValues,
  registrationRequiredOption,
  registrationRequiredValues,
  vehicleAllowedOption,
  vehicleAllowedValues,
} from "@/lib/listings/types"
import {
  idStatusValues,
  partnerRoomsValues,
  petNeedValues,
  vehicleNeedValues,
  vehicleRegisteredValues,
} from "@/lib/matching/needs"
import {
  couplesFit,
  idFit,
  maxStayNights,
  petsFit,
  registrationFit,
  vehicleFit,
} from "@/lib/matching/vocabulary"

// Object.keys on a label map is what drives the provider dropdowns, and
// TypeScript cannot enumerate a union at runtime. So a value that exists in the
// database with no entry in its option map silently disappears from the Select,
// and staff can never choose it again. These tests are the guard.
const maps: [string, readonly string[], Record<string, string>][] = [
  ["freshness", freshnessValues, freshnessLabel],
  ["intakeMethod", intakeMethodValues, intakeLabel],
  ["parkingStatus", parkingStatusValues, parkingStatusLabel],
  ["pets", petsPolicyValues, petsOption],
  ["couples", couplesPolicyValues, couplesOption],
  ["idRequired", idRequiredValues, idRequiredOption],
  ["curfewPolicy", curfewPolicyValues, curfewPolicyOption],
  ["maxStay", maxStayValues, maxStayOption],
  ["vehicleAllowed", vehicleAllowedValues, vehicleAllowedOption],
  [
    "registrationRequired",
    registrationRequiredValues,
    registrationRequiredOption,
  ],
]

describe("enum option maps", () => {
  for (const [name, values, map] of maps) {
    it(`${name} has a label for every value and no extras`, () => {
      expect(Object.keys(map).sort()).toEqual([...values].sort())
    })

    it(`${name} labels are all non empty`, () => {
      for (const value of values) {
        expect(map[value]?.trim(), `${name}.${value}`).toBeTruthy()
      }
    })
  }

  it("keeps maxStayNights in step with maxStay", () => {
    expect(Object.keys(maxStayNights).sort()).toEqual([...maxStayValues].sort())
  })
})

// The bridge tables are Record<seekerValue, Record<siteValue, Compat>>, so a
// missing combination is a TypeScript error at the declaration. These tests
// cover the runtime side: that every cell is a real verdict, not undefined,
// which is what a stale localStorage value used to produce.
const bridges: [
  string,
  readonly string[],
  readonly string[],
  Record<string, Record<string, string>>,
][] = [
  ["petsFit", petNeedValues, petsPolicyValues, petsFit],
  ["couplesFit", partnerRoomsValues, couplesPolicyValues, couplesFit],
  ["idFit", idStatusValues, idRequiredValues, idFit],
  ["vehicleFit", vehicleNeedValues, vehicleAllowedValues, vehicleFit],
  [
    "registrationFit",
    vehicleRegisteredValues,
    registrationRequiredValues,
    registrationFit,
  ],
]

describe("seeker to site bridge tables", () => {
  for (const [name, needValues, siteValues, table] of bridges) {
    it(`${name} covers every pairing with a real verdict`, () => {
      for (const need of needValues) {
        for (const site of siteValues) {
          expect(
            ["fits", "check", "excluded"],
            `${name}[${need}][${site}]`
          ).toContain(table[need]?.[site])
        }
      }
    })
  }

  it("never excludes a service animal", () => {
    // A service animal is not a pet. Under the ADA it generally has to be
    // allowed, so excluding a "no pets" site would hide a bed the person has a
    // right to. It reports "check" so the UI can explain.
    for (const policy of petsPolicyValues) {
      expect(petsFit.service_animal[policy], policy).not.toBe("excluded")
    }
    expect(petsFit.service_animal.not_allowed).toBe("check")
  })

  it("excludes a larger pet everywhere except an any-pet site", () => {
    expect(petsFit.larger_pet.any).toBe("fits")
    expect(petsFit.larger_pet.not_allowed).toBe("excluded")
    expect(petsFit.larger_pet.service_only).toBe("excluded")
    expect(petsFit.larger_pet.small_pets).toBe("excluded")
  })

  it("never excludes on case by case", () => {
    // These are exactly the answers that mean "we will work with you".
    expect(idFit.no_id.case_by_case).not.toBe("excluded")
    expect(idFit.in_progress.case_by_case).not.toBe("excluded")
    expect(registrationFit.no.case_by_case).not.toBe("excluded")
  })

  it("excludes someone with no ID only from a site that requires it", () => {
    expect(idFit.no_id.required).toBe("excluded")
    expect(idFit.no_id.not_required).toBe("fits")
  })

  it("cannot tell an RV from a van at a van-only lot", () => {
    // The seeker option covers RV and van in one answer, so this is genuinely
    // undecidable. "check" keeps the lot visible with the reason rather than
    // turning away a van or misleading an RV.
    expect(vehicleFit.rv_van.car_van).toBe("check")
    expect(vehicleFit.rv_van.car_only).toBe("excluded")
    expect(vehicleFit.rv_van.car_van_rv).toBe("fits")
  })

  it("treats either-rooms as compatible with both room layouts", () => {
    expect(couplesFit.either.same_room).toBe("fits")
    expect(couplesFit.either.separate_rooms).toBe("fits")
    expect(couplesFit.either.not_allowed).toBe("excluded")
  })
})
