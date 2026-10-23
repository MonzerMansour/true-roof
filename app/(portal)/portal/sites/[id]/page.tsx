import type { Metadata } from "next"
import Link from "next/link"
import { IconPencil } from "@tabler/icons-react"

import { ListingInterestPanel } from "@/components/portal/listing-interest-panel"
import { ShareSiteCard } from "@/components/portal/share-site-card"
import { PlaceDetail } from "@/components/places/place-detail"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getInterestForListing } from "@/lib/listings/interest"
import { getListingById } from "@/lib/listings/queries"
import { fetchListingAccessCode } from "@/lib/portal/actions"
import { getListingForPortal } from "@/lib/portal/queries"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Your site",
}

/**
 * A site as the people looking for one see it.
 *
 * This is where pressing a site on the dashboard lands, rather than straight
 * into a form. What staff most need to know is what their site actually says
 * to somebody deciding where to sleep, and a page of input boxes does not
 * show them that.
 *
 * It is the seeker's page with the seeker's half taken out: no match score,
 * no fit against anybody's answers, no asking for a bed. In their place are
 * the two things that are theirs, which are the requests waiting and the code
 * that lets someone help.
 */
export default async function SitePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { listing, canManage, isShared } = await getListingForPortal(id)

  // The seeker-shaped record, which carries the organization name and review
  // counts the portal's own shape does not.
  // Null for a draft: the public query only serves published rows.
  const seekerRecord = await getListingById(id)
  const asSeekerSeesIt = seekerRecord?.listing ?? null
  const interest = await getInterestForListing(id)
  const accessCode = await fetchListingAccessCode(id)

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {listing.published ? (
              <Badge variant="outline">On the Places list</Badge>
            ) : (
              <Badge variant="secondary">Draft, not visible yet</Badge>
            )}
            {isShared ? <Badge variant="outline">Shared with you</Badge> : null}
          </div>
          <h1 className="font-heading mt-2 text-2xl font-semibold">
            {listing.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            This is the page people see. Nothing here is a form.
          </p>
        </div>
        <Link
          href={`/portal/sites/${id}/settings`}
          className={cn(buttonVariants({ size: "touch" }))}
        >
          <IconPencil />
          Edit details
        </Link>
      </div>

      {/* Requests first: the one thing on this page that somebody is waiting
          on, and the reason to open the site at all on a given day. */}
      <ListingInterestPanel rows={interest} />

      {asSeekerSeesIt ? (
        <div className="rounded-2xl border bg-card/40 p-4 sm:p-6">
          <PlaceDetail listing={asSeekerSeesIt} preview />
        </div>
      ) : (
        <p className="text-muted-foreground">
          This site is a draft, so there is nothing on the Places list to show
          yet. Fill in its details and publish it.
        </p>
      )}

      <ShareSiteCard
        listingId={listing.id}
        listingName={listing.name}
        initialCode={accessCode}
        canRotate={canManage}
      />
    </div>
  )
}
