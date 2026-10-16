import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { seedListings } from "@/lib/listings/seed"
import { sitePhotos } from "@/lib/listings/site-photos"
import {
  standInPhotoFor,
  standInPoolSizeFor,
} from "@/lib/listings/stand-in-photo"
import type { Listing } from "@/lib/listings/types"

function listing(over: Partial<Listing> = {}): Listing {
  return { ...seedListings[0], ...over } as Listing
}

describe("the stand-in matches what the record says", () => {
  it("shows the largest vehicle a lot actually takes", () => {
    const rv = standInPhotoFor(
      listing({ kind: "parking", vehicleAllowed: "car_van_rv" })
    )
    const van = standInPhotoFor(
      listing({ kind: "parking", vehicleAllowed: "car_van" })
    )
    const car = standInPhotoFor(
      listing({ kind: "parking", vehicleAllowed: "car_only" })
    )

    expect(rv.src).toContain("lot_rv")
    expect(van.src).toContain("lot_van")
    expect(car.src).toContain("lot_car")
  })

  it("claims the least when a lot has not published what it takes", () => {
    // Null means not published. Showing a motorhome would send somebody in an
    // RV to a lot that turns them away.
    const unknown = standInPhotoFor(
      listing({ kind: "parking", vehicleAllowed: null })
    )
    expect(unknown.src).toContain("lot_car")
  })

  it("never shows a vehicle for a shelter or a building for a lot", () => {
    for (const site of seedListings) {
      const { src } = standInPhotoFor(site)
      const isLotPicture = /\/lot_/.test(src)
      expect(isLotPicture, `${site.name}: ${src}`).toBe(site.kind === "parking")
    }
  })

  it("gives a safe haven a house rather than a block", () => {
    expect(
      standInPhotoFor(listing({ kind: "shelter", projectType: "safe_haven" })).src
    ).toContain("/house-")
  })
})

describe("the pools are big enough to be worth having", () => {
  it("draws every kind of site from a double-figure pool", () => {
    // It used to be four pictures for a hundred and eleven shelters, so one
    // photograph was the face of about sixteen different places. Ten is the
    // floor rather than twenty because the RV pool is eleven pictures for the
    // five lots that take RVs, which needs no more than that.
    for (const site of seedListings) {
      expect(standInPoolSizeFor(site), site.name).toBeGreaterThanOrEqual(10)
    }
  })

  it("repeats a picture across the real sites only a handful of times", () => {
    // Arithmetic sets the floor here, not the code: there are 111 shelters and
    // 71 building photographs, so something has to repeat. Picking by hash
    // rather than by rank adds some unevenness on top, and the row house pool
    // carries two groups because a terrace suits both a converted shelter and
    // transitional housing. Six is where that lands. It was 28 before.
    const used = new Map<string, number>()
    for (const site of seedListings) {
      const { src } = standInPhotoFor(site)
      used.set(src, (used.get(src) ?? 0) + 1)
    }
    const worst = Math.max(...used.values())
    expect(worst, `worst repeat is ${worst}`).toBeLessThanOrEqual(6)
  })

  it("uses most of what was downloaded rather than a corner of it", () => {
    const used = new Set(seedListings.map((s) => standInPhotoFor(s).src))
    const available = Object.values(sitePhotos).flat().length
    // Lots outnumber their pools, so not every picture can be reached, but a
    // clumping hash would show up here as a small fraction.
    expect(used.size / available).toBeGreaterThan(0.45)
  })

  it("is stable, so a card keeps its picture between renders", () => {
    for (const site of seedListings.slice(0, 25)) {
      expect(standInPhotoFor(site).src).toBe(standInPhotoFor(site).src)
    }
  })
})

describe("every picture is on disk and properly attributed", () => {
  it("has a file where the manifest says, for all of them", () => {
    // A generated manifest can outlive the files it names, and a broken image
    // on a shelter card is worse than no picture.
    for (const [category, photos] of Object.entries(sitePhotos)) {
      expect(photos.length, category).toBeGreaterThan(0)
      for (const photo of photos) {
        expect(
          existsSync(`public${photo.src}`),
          `${photo.src} is in the manifest but not on disk`
        ).toBe(true)
      }
    }
  })

  it("names an author, a licence and a source for every picture", () => {
    // Attribution is a condition of most of these licences, not a courtesy.
    for (const photo of Object.values(sitePhotos).flat()) {
      expect(photo.author.length, photo.src).toBeGreaterThan(0)
      expect(photo.licence.length, photo.src).toBeGreaterThan(0)
      expect(photo.source, photo.src).toMatch(/^https:\/\/commons\.wikimedia\.org\//)
    }
  })

  it("uses no picture in two pools, so a repeat is never a surprise", () => {
    const all = Object.values(sitePhotos).flat().map((p) => p.src)
    expect(new Set(all).size).toBe(all.length)
  })
})
