import { describe, expect, it } from "vitest"

import { cityCenters } from "@/lib/listings/geo"
import { featuredListingIds, seedListings } from "@/lib/listings/seed"
import {
  hicFacilities,
  hicOrganizations,
} from "@/lib/listings/sources/hud-hic-ca500-2025"
import { safeParkingSites } from "@/lib/listings/sources/safe-parking-ca500"
import { sourcePublishes, unknownCity } from "@/lib/listings/sources"
import type { PolicyField } from "@/lib/listings/sources"
import type { Listing } from "@/lib/listings/types"

describe("seed listings", () => {
  it("has one row per non confidential HUD facility plus every parking site", () => {
    const confidential = hicFacilities.filter((site) => site.confidential)
    expect(confidential.length).toBeGreaterThan(0)
    expect(seedListings).toHaveLength(
      hicFacilities.length - confidential.length + safeParkingSites.length
    )
  })

  it("leaves out every domestic violence program", () => {
    // Their locations are deliberately not public, and crisis and DV go
    // through a separate human path. A regression here would publish a
    // confidential address.
    const names = new Set(seedListings.map((site) => site.name))
    for (const site of hicFacilities.filter((s) => s.confidential)) {
      expect(names.has(site.facility)).toBe(false)
    }
  })

  it("has no duplicate ids", () => {
    const ids = seedListings.map((site) => site.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("records a source and an as-of date on every row", () => {
    for (const site of seedListings) {
      expect(site.dataSource, site.name).not.toBeNull()
      expect(site.sourceAsOf, site.name).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(site.sourceUrl, site.name).toMatch(/^https:\/\//)
    }
  })

  it("never invents a policy the source does not publish", () => {
    // The whole point of Task 1. If HUD does not publish pets, the column is
    // null. A non-null value here means someone guessed.
    const checks: [PolicyField, keyof Listing][] = [
      ["pets", "pets"],
      ["couples", "couples"],
      ["idRequired", "idRequired"],
      ["maxStay", "maxStay"],
      ["petWeightLimitLbs", "petWeightLimitLbs"],
      ["vehicleAllowed", "vehicleAllowed"],
      ["registrationRequired", "registrationRequired"],
      ["address", "address"],
    ]

    for (const site of seedListings) {
      for (const [field, key] of checks) {
        if (sourcePublishes(site.dataSource, field)) continue
        expect(site[key], `${site.name} ${String(key)}`).toBeNull()
      }
    }
  })

  it("dates HUD rows to the count date, not to now", () => {
    // last_confirmed_at defaults to now() in SQL. If that default ever leaks
    // into the HUD rows, a January 2025 count renders as "Confirmed 1 minute
    // ago", which is the most damaging thing this data could claim.
    const hud = seedListings.filter((s) => s.dataSource === "hud_hic_2025")
    expect(hud.length).toBeGreaterThan(50)
    for (const site of hud) {
      expect(site.lastConfirmedAt, site.name).toContain("2025-01-22")
      expect(site.freshness, site.name).toBe("call_first")
    }
  })

  it("only claims a city it can place, or says county wide", () => {
    // A city not in cityCenters would silently measure distance from downtown
    // San Jose. unknownCity is the one allowed exception and is deliberately
    // absent from cityCenters so it reads "Distance not known".
    for (const site of seedListings) {
      if (site.city === unknownCity) continue
      expect(
        cityCenters[site.city],
        `${site.name} in ${site.city}`
      ).toBeDefined()
    }
  })

  it("resolves every featured id", () => {
    for (const id of featuredListingIds) {
      expect(
        seedListings.find((site) => site.id === id),
        id
      ).toBeDefined()
    }
  })

  it("gives every organization a stable id shared across its facilities", () => {
    const orgIds = new Set(hicOrganizations.map((org) => org.id))
    for (const site of hicFacilities) {
      expect(orgIds.has(site.orgId), site.facility).toBe(true)
    }
  })
})

describe("safe parking sources", () => {
  it("keeps the two San Jose sites' registration rules distinct", () => {
    // The city page states these differ. It is the clearest published policy
    // difference in the dataset and the fixture the matcher tests rely on.
    const teresa = safeParkingSites.find((s) =>
      s.name.startsWith("Santa Teresa")
    )
    const berryessa = safeParkingSites.find((s) =>
      s.name.startsWith("Berryessa")
    )
    expect(teresa?.registrationRequired).toBe("required")
    expect(berryessa?.registrationRequired).toBe("not_required")
  })

  it("has at least one entry window that wraps past midnight", () => {
    // The overnight lots are 7pm to 7am. This is the edge case the time
    // overlap logic has to handle, so the data must keep exercising it.
    const wrapping = safeParkingSites.filter(
      (s) => s.intakeFrom && s.intakeTo && s.intakeTo < s.intakeFrom
    )
    expect(wrapping.length).toBeGreaterThan(0)
  })
})
