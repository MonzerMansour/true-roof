import { MarketingPhoto, StandInPhotoBadge } from "@/components/marketing/marketing-photo"
import { uploadedPhotoFor } from "@/lib/listings/photos"
import { standInPhotoFor } from "@/lib/listings/stand-in-photo"
import type { Listing } from "@/lib/listings/types"

/**
 * The picture at the top of a listing, whichever kind it is.
 *
 * One component rather than three call sites each deciding, because the
 * decision carries the "this is not the place" label with it and a surface
 * that forgot the label would be the whole problem again.
 *
 * A photograph of the actual site only ever appears when its own staff
 * uploaded one. Everything else is a stand-in, picked from a pool chosen to
 * match what the record says the place is.
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
  const uploaded = uploadedPhotoFor(listing)

  if (uploaded) {
    return (
      <MarketingPhoto
        photo={uploaded}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    )
  }

  const standIn = standInPhotoFor(listing)

  return (
    <div className="relative">
      <MarketingPhoto
        photo={{
          src: standIn.src,
          // Says what it is before it says what it shows, so somebody using a
          // screen reader is never told this is a picture of the site.
          alt: `Stand-in picture, not ${listing.name}. Shows ${standIn.description}.`,
          credit: `${standIn.author} / ${standIn.licence}`,
        }}
        className={className}
        sizes={sizes}
        priority={priority}
      />
      {showBadge ? <StandInPhotoBadge /> : null}
    </div>
  )
}
