import { photos, type Photo } from "@/lib/photos"
import type { Listing } from "@/lib/listings/types"

/**
 * A photo shown for a listing, and whether it is actually that place.
 *
 * The flag is the point. A photograph of a bright hallway under the name of a
 * shelter reads as that shelter's hallway, and somebody choosing where to
 * sleep tonight will read it that way. This file is the only place that knows
 * which it is, so every surface that shows a listing photo can say so.
 */
export type ListingPhoto = Photo & {
  /** True only when the site's own staff uploaded it through the portal. */
  ofThisPlace: boolean
}

// Stand-ins, used when nobody has uploaded a photo of the real site.
//
// Every one of these is a generic photograph. They exist so a card is not a
// grey box, and for no other reason: none of them is any of these sites, and
// the label on every surface says so.
//
// Deliberately only images that could plausibly be somewhere you stay or
// park. A kitchen counter or a desk would be worse than a grey box, because
// it invents a fact about the place rather than just failing to show one.
const shelterPhotos: Photo[] = [
  photos.building,
  photos.exterior,
  photos.window,
  photos.apartment,
  photos.hallway,
  photos.community,
  photos.nightCity,
]

// Three, not four: public/images/lot-dusk.jpg is a byte-identical copy of
// parking.jpg, so listing both would have looked like more variety than it
// was and quietly halved the spread.
const parkingPhotos: Photo[] = [photos.parking, photos.garage, photos.van]

/** Sum of character codes, which is weak as hashes go but measured to spread
 * the real ids evenly: over the 119 ids in lib/listings/sources the four
 * buckets came out 33/32/29/25. UUIDs are hex plus dashes, so there is little
 * for a stronger hash to improve. Changing it would reshuffle which stand-in
 * each site gets for no gain. */
function hashId(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function photoForListing(listing: Listing): ListingPhoto {
  // A photo the site's own staff uploaded beats any stand-in, and it is the
  // only source of a real one. Nothing here goes looking for a photograph of
  // a site on the web: several safe parking lots withhold their address on
  // purpose, and a recognizable picture of the place is the address.
  if (listing.photoUrl) {
    return {
      src: listing.photoUrl,
      alt: `${listing.name}, photographed by the people who run it`,
      credit: listing.orgName ?? listing.name,
      ofThisPlace: true,
    }
  }

  const pool = listing.kind === "parking" ? parkingPhotos : shelterPhotos
  const stand_in = pool[hashId(listing.id) % pool.length]

  return {
    ...stand_in,
    // The stand-in's own alt text describes the photograph, which read as a
    // description of this site to anybody using a screen reader. Say what it
    // is first, so the picture is never mistaken for the place.
    alt: `Stand-in picture, not ${listing.name}. ${stand_in.alt}.`,
    credit: stand_in.credit,
    ofThisPlace: false,
  }
}

/** How many sites share each stand-in, for the portal nudge and for anyone
 * wondering whether the pool is big enough. */
export function standInPoolSize(kind: Listing["kind"]) {
  return kind === "parking" ? parkingPhotos.length : shelterPhotos.length
}
