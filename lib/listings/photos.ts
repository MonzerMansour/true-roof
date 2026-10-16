import type { Photo } from "@/lib/photos"
import type { Listing } from "@/lib/listings/types"

/**
 * The one real photograph a listing can have: the one its own staff uploaded
 * through the portal.
 *
 * There used to be a pool of four stock photographs here for a hundred and
 * eleven shelters, so each one was the face of about sixteen different places,
 * and one of them was a modern house with a swimming pool. A site without a
 * real photo now gets a stand-in from a pool chosen to match what its record
 * says it is. See lib/listings/stand-in-photo.ts.
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
