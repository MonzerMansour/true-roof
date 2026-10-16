import { describe, expect, it } from "vitest"

import { seedListings } from "@/lib/listings/seed"
import {
  artworkForListing,
  artworkPalette,
  lightnessOf,
} from "@/lib/listings/site-artwork"
import type { Listing } from "@/lib/listings/types"

function listing(over: Partial<Listing> = {}): Listing {
  return { ...seedListings[0], ...over } as Listing
}

describe("the drawing matches what the record says", () => {
  it("draws the largest vehicle a lot actually takes", () => {
    // Somebody sleeping in an RV is scanning for a lot that will have them.
    // Drawing a saloon car on an RV lot would be a worse lie than drawing
    // nothing.
    const rv = artworkForListing(
      listing({ kind: "parking", vehicleAllowed: "car_van_rv" })
    )
    const van = artworkForListing(
      listing({ kind: "parking", vehicleAllowed: "car_van" })
    )
    const car = artworkForListing(
      listing({ kind: "parking", vehicleAllowed: "car_only" })
    )

    expect(rv.scene).toBe("lot_rv")
    expect(van.scene).toBe("lot_van")
    expect(car.scene).toBe("lot_car")
  })

  it("claims the least when a lot has not said what it takes", () => {
    const unknown = artworkForListing(
      listing({ kind: "parking", vehicleAllowed: null })
    )
    // Null means not published, so the drawing must not imply RV access.
    expect(unknown.scene).toBe("lot_car")
  })

  it("draws a shelter as what HUD says the project is", () => {
    expect(
      artworkForListing(listing({ kind: "shelter", projectType: "emergency_shelter" }))
        .scene
    ).toBe("block")
    expect(
      artworkForListing(
        listing({ kind: "shelter", projectType: "transitional_housing" })
      ).scene
    ).toBe("terrace")
    expect(
      artworkForListing(listing({ kind: "shelter", projectType: "safe_haven" })).scene
    ).toBe("cottage")
  })

  it("falls back without inventing a kind of place", () => {
    // A null project type must not become a dormitory block or a lone
    // cottage, both of which say something about the site.
    expect(
      artworkForListing(listing({ kind: "shelter", projectType: null })).scene
    ).toBe("terrace")
  })

  it("never draws a building on a lot or a vehicle at a shelter", () => {
    for (const site of seedListings) {
      const { scene } = artworkForListing(site)
      if (site.kind === "parking") {
        expect(scene.startsWith("lot_"), `${site.name}: ${scene}`).toBe(true)
      } else {
        expect(scene.startsWith("lot_"), `${site.name}: ${scene}`).toBe(false)
      }
    }
  })
})

describe("no two sites get the same picture", () => {
  it("gives every real site its own hue and window pattern", () => {
    // The whole point of drawing these rather than shipping four photographs
    // for a hundred and eleven shelters.
    const seen = new Set(
      seedListings.map((site) => {
        const a = artworkForListing(site)
        return `${a.scene}:${a.hue}:${a.litWindows}:${a.variant}`
      })
    )
    expect(seen.size).toBe(seedListings.length)
  })

  it("spreads hues around the whole circle rather than clustering", () => {
    const hues = seedListings.map((site) => artworkForListing(site).hue)
    const twelfths = new Set(hues.map((h) => Math.floor(h / 30)))
    // Twelve 30 degree segments; a clustered hash would land in a handful.
    expect(twelfths.size).toBeGreaterThanOrEqual(10)
  })

  it("is stable, so a card does not change picture between renders", () => {
    for (const site of seedListings.slice(0, 20)) {
      expect(artworkForListing(site)).toEqual(artworkForListing(site))
    }
  })
})

describe("artworkPalette", () => {
  it("builds every colour it is asked for, at a readable lightness", () => {
    for (const hue of [0, 45, 120, 200, 280, 359]) {
      const p = artworkPalette(hue)
      for (const [name, value] of Object.entries(p)) {
        expect(value, name).toMatch(/^oklch\(/)
      }
      // Mid tones only. The drawing fills its own tile and has to read on a
      // light card and a dark one without being redrawn.
      const lightness = Number(p.skyTop.match(/oklch\(([\d.]+)/)![1])
      expect(lightness).toBeGreaterThan(0.2)
      expect(lightness).toBeLessThan(0.95)
    }
  })
})

describe("things drawn on top of other things are actually visible", () => {
  // The first version failed this. ground was oklch(0.46) and solidLight was
  // oklch(0.34): the second car in every lot was painted four hundredths of a
  // lightness step away from the tarmac under it, so the drawing looked like
  // it had one vehicle in it. Arithmetic catches that; a glance at a card
  // does not.
  const MIN_STEP = 0.12

  const stacked: [keyof ReturnType<typeof artworkPalette>, keyof ReturnType<typeof artworkPalette>][] =
    [
      ["solid", "ground"],
      ["solidLight", "ground"],
      ["solid", "skyBottom"],
      ["solidLight", "skyBottom"],
      ["lit", "solid"],
      ["lit", "solidLight"],
      ["unlit", "solidLight"],
    ]

  it("keeps every stacked pair a real step apart, at every hue", () => {
    for (const hue of [0, 60, 120, 180, 240, 300, 359]) {
      const p = artworkPalette(hue)
      for (const [over, under] of stacked) {
        const step = Math.abs(lightnessOf(p[over]) - lightnessOf(p[under]))
        expect(
          step,
          `${over} on ${under} at hue ${hue} is only ${step.toFixed(3)} apart`
        ).toBeGreaterThanOrEqual(MIN_STEP)
      }
    }
  })

  it("keeps the sky lighter than the ground, so the horizon reads", () => {
    for (const hue of [0, 90, 180, 270]) {
      const p = artworkPalette(hue)
      expect(lightnessOf(p.skyBottom)).toBeGreaterThan(lightnessOf(p.ground))
    }
  })
})
