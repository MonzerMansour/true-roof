import Link from "next/link"
import { IconExternalLink, IconPencil } from "@tabler/icons-react"

import { ListingImage } from "@/components/places/listing-image"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { PortalListing } from "@/lib/portal/types"
import { cn } from "cn"

/**
 * One site on the portal dashboard, shown the way a seeker sees it.
 *
 * Staff were given a list of names and a settings link, which told them
 * nothing about what their site actually looks like to the people it is for.
 * This is the seeker's card: the same picture, the same badges, in the same
 * order. What it leaves out is the matching, which is about one seeker's
 * answers and means nothing here.
 *
 * What it adds is the one thing staff come here to do, which is edit it, and
 * the state the seeker cannot see: whether it is published at all.
 */
export function PortalSiteCard({
  listing,
  shared,
}: {
  listing: PortalListing
  /** Run by another organization and shared by code. Theirs, not yours. */
  shared?: boolean
}) {
  return (
    <Card className="relative overflow-hidden p-0 transition-colors hover:bg-muted/30">
      <Link href={`/portal/sites/${listing.id}`} className="block">
        <ListingImage
          listing={listing}
          className="h-36"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Draft first: it is the one thing that stops the site being seen
              at all, so it should not be the last badge read. */}
          {listing.published ? null : <Badge variant="secondary">Draft</Badge>}
          <Badge variant="outline">
            {listing.kind === "parking" ? "Safe parking" : "Shelter"}
          </Badge>
          {shared ? <Badge variant="outline">Shared with you</Badge> : null}
        </div>

        <div>
          <h3 className="font-heading text-lg font-semibold">
            <Link
              href={`/portal/sites/${listing.id}`}
              className="after:absolute after:inset-0 hover:underline"
            >
              {listing.name}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">{listing.city}</p>
        </div>

        {listing.published ? null : (
          <p className="text-sm text-muted-foreground">
            Not on the Places list yet. Publish it in its details.
          </p>
        )}

        {/* relative + z-10 so these sit above the card-wide link above. */}
        <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-1">
          <Link
            href={`/portal/sites/${listing.id}/settings`}
            className={cn(buttonVariants({ variant: "outline", size: "touch" }))}
          >
            <IconPencil />
            Edit details
          </Link>
          {listing.published ? (
            // A link styled as a button, not a Button rendering a link: Base
            // UI warns on the latter because it strips the native button
            // semantics that forms and assistive tech rely on.
            <Link
              href={`/places/${listing.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "touch" }))}
            >
              <IconExternalLink />
              Open the real page
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
