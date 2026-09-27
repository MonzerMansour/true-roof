import { photos, type Photo } from "@/lib/photos"
import type { Listing } from "@/lib/listings/types"

const shelterPhotos: Photo[] = [
  photos.building,
  photos.exterior,
  photos.window,
  photos.apartment,
]

const parkingPhotos: Photo[] = [photos.parking, photos.garage, photos.van]

function hashId(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function photoForListing(listing: Listing): Photo {
  const pool = listing.kind === "parking" ? parkingPhotos : shelterPhotos
  return pool[hashId(listing.id) % pool.length]
}
