import { MarketingPhoto, StandInPhotoBadge } from "@/components/marketing/marketing-photo"
import { SiteArtwork } from "@/components/places/site-artwork"
import { uploadedPhotoFor } from "@/lib/listings/photos"
import { artworkForListing } from "@/lib/listings/site-artwork"
import type { Listing } from "@/lib/listings/types"

/**
 * The picture at the top of a listing, whichever kind it is.
 *
 * One component rather than three call sites each deciding, because the
 * decision carries the "this is not the place" label with it and a surface
 * that forgot the label would be the whole problem again.
 *
 * A photo only ever appears here when the site's own staff uploaded one. Every
 * other site gets a drawing, which is different for every site and obviously
 * not a photograph of anywhere.
 */
export function ListingImage({
  listing,
  className,
  sizes,
  priority,
  showBadge = true,
}: {
  listing: Listing
  className?: string
  sizes?: string
  priority?: boolean
  /** Off where something else already says it, like the detail page, which
   * has room for the full sentence underneath. */
  showBadge?: boolean
}) {
  const photo = uploadedPhotoFor(listing)

  if (photo) {
    return (
      <MarketingPhoto
        photo={photo}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    )
  }

  const { description } = artworkForListing(listing)

  return (
    <div className="relative">
      <SiteArtwork listing={listing} className={className} />
      {/* The drawing itself is aria-hidden, so this carries the whole message
          for anybody who cannot see it. It says what it is before it says
          what it shows, so the picture is never taken for the place. */}
      <span className="sr-only">
        {`Drawing, not a photo of ${listing.name}: ${description}.`}
      </span>
      {showBadge ? <StandInPhotoBadge /> : null}
    </div>
  )
}
