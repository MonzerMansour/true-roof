import type { Metadata } from "next"

import { ListingInterestPanel } from "@/components/portal/listing-interest-panel"
import { ListingReviewsPanel } from "@/components/portal/listing-reviews-panel"
import { ListingSettingsForm } from "@/components/portal/listing-settings-form"
import { SitePhotoField } from "@/components/portal/site-photo-field"
import { getInterestForListing } from "@/lib/listings/interest"
import {
  getReportCountsForReviews,
  getStaffReviewsForListing,
} from "@/lib/listings/reviews"
import { getListingForPortal } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Site settings",
}

export default async function SiteSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { listing, organization, canManage } = await getListingForPortal(id)
  const interest = await getInterestForListing(id)
  const reviews = await getStaffReviewsForListing(id)
  const reportMap = await getReportCountsForReviews(reviews.map((r) => r.id))
  const reportCounts = Object.fromEntries(reportMap.entries())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Site settings</h1>
        <p className="mt-1 text-muted-foreground">
          Update what seekers see. Enums only. Confirming keeps the freshness
          badge honest.
        </p>
      </div>
      <ListingInterestPanel rows={interest} />
      <SitePhotoField listingId={listing.id} photoUrl={listing.photoUrl} />
      <ListingReviewsPanel
        listing={listing}
        reviews={reviews}
        reportCounts={reportCounts}
        canManage={canManage}
      />
      <ListingSettingsForm
        listing={listing}
        organization={organization}
        canManage={canManage}
      />
    </div>
  )
}
