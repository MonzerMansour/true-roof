import type { Metadata } from "next"

import { ListingInterestPanel } from "@/components/portal/listing-interest-panel"
import { CustomerReviewsPanel } from "@/components/portal/customer-reviews-panel"
import { ListingReviewsPanel } from "@/components/portal/listing-reviews-panel"
import { ListingSettingsForm } from "@/components/portal/listing-settings-form"
import { getInterestForListing } from "@/lib/listings/interest"
import {
  getCustomerReportCounts,
  getReportCountsForReviews,
  getStaffCustomerReviewsForListing,
  getStaffReviewsForListing,
} from "@/lib/listings/reviews"
import { getListingForPortal } from "@/lib/portal/queries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const customerReviews = await getStaffCustomerReviewsForListing(id)
  const customerReportMap = await getCustomerReportCounts(
    customerReviews.map((r) => r.id)
  )
  const customerReportCounts = Object.fromEntries(customerReportMap.entries())

  const count = (n: number) => (n > 0 ? ` (${n})` : "")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{listing.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Pick what you want to work on. Saving site details also confirms the
          listing is current.
        </p>
      </div>

      {/* One aspect at a time. Site details stays mounted so unsaved edits
          survive a look at another tab. */}
      <Tabs defaultValue="details">
        <div className="max-w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value="details">Site details</TabsTrigger>
            <TabsTrigger value="requests">
              Requests{count(interest.length)}
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews{count(reviews.length)}
            </TabsTrigger>
            <TabsTrigger value="notes">
              Private notes{count(customerReviews.length)}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" keepMounted className="pt-4">
          {/* Keyed on the confirmed time, which every save updates, so the
              form starts fresh from the saved values after a save instead of
              having its fields' starting values changed under it. */}
          <ListingSettingsForm
            key={listing.lastConfirmedAt}
            listing={listing}
            organization={organization}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="requests" className="pt-4">
          <ListingInterestPanel rows={interest} />
        </TabsContent>
        <TabsContent value="reviews" className="pt-4">
          <ListingReviewsPanel
            listing={listing}
            reviews={reviews}
            reportCounts={reportCounts}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="notes" className="pt-4">
          <CustomerReviewsPanel
            listingId={listing.id}
            interest={interest}
            reviews={customerReviews}
            reportCounts={customerReportCounts}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
