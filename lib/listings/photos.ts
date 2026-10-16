import type { Photo } from "@/lib/photos"
import type { Listing } from "@/lib/listings/types"

/**
 * The one real photograph a listing can have: the one its own staff uploaded
 * through the portal.
 *
 * There used to be a pool of stock photographs here, picked by a hash, for
 * every site nobody had photographed. It was four pictures for a hundred and
 * eleven shelters, so each one was the face of about sixteen different places,
 * and one of them was a modern house with a swimming pool. Those are gone:
 * a site without a real photo gets a drawing instead, built per site from what
 * the record actually says. See lib/listings/site-artwork.ts.
 *
 * Nothing here goes looking for a photograph of a site on the web, and nothing
 * should. Several safe parking lots withhold their address on purpose and one
 * has none at all because the city called the site unpermitted; a recognizable
 * picture of a place is its address.
 */
export function uploadedPhotoFor(listing: Listing): Photo | null {
  if (!listing.photoUrl) return null

  return {
    src: listing.photoUrl,
    alt: `${listing.name}, photographed by the people who run it`,
    credit: listing.orgName ?? listing.name,
  }
}
