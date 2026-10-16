import type { Listing } from "@/lib/listings/types"

// What a site's stand-in picture should show.
//
// Stock photographs were the wrong tool here twice over. There were four of
// them for a hundred and eleven shelters, so the same picture was the face of
// roughly sixteen different places; and one of them was a modern house with a
// swimming pool, which is not a thing to put under the name of an emergency
// shelter. A drawing fixes both: it can be different for every site, and
// nobody mistakes it for a photograph of the building.
//
// What it shows is taken from what the record actually says. An emergency
// shelter gets a block with a lot of windows, transitional housing gets a
// terrace, a lot that takes RVs is drawn with an RV in it. Where the record
// says nothing, the drawing says nothing either: it falls back to the plainest
// scene rather than inventing a kind of place.

export type ArtworkScene =
  | "block"
  | "terrace"
  | "cottage"
  | "lot_car"
  | "lot_van"
  | "lot_rv"

export type ArtworkSpec = {
  scene: ArtworkScene
  /** Base hue in degrees. Everything in the drawing is derived from it, so one
   * number is the whole palette and no two neighbouring cards look alike. */
  hue: number
  /** Which windows are lit, as a bitmask read left to right, top to bottom.
   * Fixed per site so a card does not flicker between renders. */
  litWindows: number
  /** Small structural wobble: how many buildings, how tall. Keeps two sites
   * with a similar hue from being the same picture. */
  variant: number
  /** What the drawing is of, for the alt text. */
  description: string
}

/** FNV-1a. Unlike the stand-in photo picker, this one does need a real
 * avalanche: several values are pulled out of the same hash by shifting, and
 * a sum of character codes would leave them correlated, so a site with a blue
 * sky would always have the same windows lit. */
function hash(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function sceneFor(listing: Listing): { scene: ArtworkScene; description: string } {
  if (listing.kind === "parking") {
    // Drawn with the largest vehicle the lot actually takes, because that is
    // the thing somebody sleeping in an RV is scanning the list for.
    if (listing.vehicleAllowed === "car_van_rv") {
      return { scene: "lot_rv", description: "a parking lot with an RV and a car" }
    }
    if (listing.vehicleAllowed === "car_van") {
      return { scene: "lot_van", description: "a parking lot with a van and a car" }
    }
    // car_only, and also null: a plain lot claims the least.
    return { scene: "lot_car", description: "a parking lot with two cars" }
  }

  switch (listing.projectType) {
    case "emergency_shelter":
      return { scene: "block", description: "a large building with lit windows" }
    case "transitional_housing":
      return { scene: "terrace", description: "a row of houses with lit windows" }
    case "safe_haven":
      return { scene: "cottage", description: "a small house with a tree" }
    default:
      // HUD publishes no project type for some rows. A terrace is the quietest
      // thing to draw: it does not imply a dormitory or a single cottage.
      return { scene: "terrace", description: "a row of houses with lit windows" }
  }
}

export function artworkForListing(listing: Listing): ArtworkSpec {
  const h = hash(listing.id)
  const { scene, description } = sceneFor(listing)

  return {
    scene,
    // Full circle, so neighbouring cards in the grid land far apart.
    hue: h % 360,
    litWindows: (h >>> 9) & 0xffff,
    variant: (h >>> 25) % 3,
    description,
  }
}

/** The colours of one drawing, all from its hue.
 *
 * Mid lightness on purpose. The drawing fills its own tile rather than sitting
 * on the card, so it has to read on a light card and a dark one without being
 * redrawn, and these stay clear of both ends.
 *
 * The lightness steps are the part that matters and the part that was wrong
 * first time: ground and solidLight were 0.38 and 0.34, so the second vehicle
 * in a lot was painted four hundredths away from the tarmac under it and
 * simply did not appear. Every pair that sits on top of another now differs
 * by at least 0.12, which the test checks rather than trusting the eye. */
export function artworkPalette(hue: number) {
  // Lamplight is a fixed warm, not a rotation of the base hue. Rotating it
  // meant a green scene got cyan windows, which reads as glass rather than as
  // a light left on for somebody. It is the one colour here that should mean
  // the same thing on every card.
  const LAMP_HUE = 75
  const earth = (hue + 20) % 360

  return {
    skyTop: `oklch(0.78 0.085 ${hue})`,
    skyBottom: `oklch(0.58 0.11 ${hue})`,
    ground: `oklch(0.46 0.045 ${earth})`,
    solid: `oklch(0.22 0.035 ${earth})`,
    solidLight: `oklch(0.32 0.045 ${earth})`,
    lit: `oklch(0.92 0.14 ${LAMP_HUE})`,
    unlit: `oklch(0.17 0.02 ${earth})`,
  }
}

/** Lightness of a palette colour, for the contrast test. */
export function lightnessOf(colour: string) {
  return Number(colour.match(/oklch\(([\d.]+)/)![1])
}
