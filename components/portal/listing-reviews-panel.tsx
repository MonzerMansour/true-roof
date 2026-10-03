"use client"

import * as React from "react"
import { toast } from "sonner"

import { StarRating } from "@/components/places/star-rating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  moderateListingReview,
  updateExternalRating,
} from "@/lib/portal/actions"
import type { ListingReview } from "@/lib/listings/types"
import type { PortalListing } from "@/lib/portal/types"

export function ListingReviewsPanel({
  listing,
  reviews,
  reportCounts,
  canManage,
}: {
  listing: PortalListing
  reviews: ListingReview[]
  reportCounts: Map<string, number> | Record<string, number>
  canManage: boolean
}) {
  const counts =
    reportCounts instanceof Map
      ? reportCounts
      : new Map(Object.entries(reportCounts))

  async function onModerate(formData: FormData) {
    formData.set("listingId", listing.id)
    const result = await moderateListingReview(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Review updated.")
  }

  async function onExternal(formData: FormData) {
    formData.set("listingId", listing.id)
    const result = await updateExternalRating(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("External rating saved.")
  }

  return (
    <section className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hide or reject reviews that break the rules. External average is a
          staff estimate for display. It is not a live Google sync.
        </p>
      </div>

      {canManage ? (
        <form action={onExternal} className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="externalRating">External average</Label>
            <Input
              id="externalRating"
              name="externalRating"
              type="number"
              min={1}
              max={5}
              step={0.1}
              defaultValue={listing.externalRating ?? ""}
              placeholder="4.2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="externalRatingCount">External count</Label>
            <Input
              id="externalRatingCount"
              name="externalRatingCount"
              type="number"
              min={0}
              step={1}
              defaultValue={listing.externalRatingCount ?? ""}
              placeholder="120"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="externalRatingSource">Source label</Label>
            <Input
              id="externalRatingSource"
              name="externalRatingSource"
              defaultValue={listing.externalRatingSource ?? ""}
              placeholder="staff or google_manual"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" size="sm">
              Save external rating
            </Button>
          </div>
        </form>
      ) : null}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const reports = counts.get(review.id) ?? 0
            return (
              <li key={review.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating value={review.stars} />
                  <Badge variant="outline">{review.status}</Badge>
                  {review.verifiedStay ? (
                    <Badge variant="secondary">Visited</Badge>
                  ) : null}
                  {reports > 0 ? (
                    <Badge variant="warning">
                      {reports} report{reports === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
                {review.body ? (
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {review.body}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Stars only.
                  </p>
                )}
                <form action={onModerate} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <Button
                    type="submit"
                    name="status"
                    value="published"
                    size="sm"
                    variant="outline"
                  >
                    Publish
                  </Button>
                  <Button
                    type="submit"
                    name="status"
                    value="hidden"
                    size="sm"
                    variant="outline"
                  >
                    Hide
                  </Button>
                  <Button
                    type="submit"
                    name="status"
                    value="rejected"
                    size="sm"
                    variant="outline"
                  >
                    Reject
                  </Button>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
