"use client"

import * as React from "react"
import { toast } from "sonner"

import { StarPicker, StarRating } from "@/components/places/star-rating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  reportListingReview,
  upsertListingReview,
  withdrawOwnReview,
} from "@/lib/listings/review-actions"
import type { Listing, ListingReview, ListingReviewStats } from "@/lib/listings/types"

export function PlaceReviews({
  listing,
  reviews,
  stats,
  ownReview,
  signedIn,
}: {
  listing: Listing
  reviews: ListingReview[]
  stats: ListingReviewStats | null
  ownReview: ListingReview | null
  signedIn: boolean
}) {
  const [pending, setPending] = React.useState(false)
  const average = stats?.averageStars ?? null
  const count = stats?.reviewCount ?? 0

  async function onSubmit(formData: FormData) {
    setPending(true)
    formData.set("listingId", listing.id)
    const result = await upsertListingReview(formData)
    setPending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    if (result.status === "pending") {
      toast.success("Review saved. Staff will check it before it shows.")
    } else if (result.status === "published") {
      toast.success("Review published.")
    } else {
      toast.success("Review saved.")
    }
  }

  async function onWithdraw() {
    setPending(true)
    const result = await withdrawOwnReview(listing.id)
    setPending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Your review is hidden.")
  }

  return (
    <section className="mt-12 border-t pt-10" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="reviews-heading"
            className="font-heading text-2xl font-semibold tracking-tight"
          >
            Reviews
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            People who stayed can leave a short review. Stars required, comment
            optional.
          </p>
        </div>
        {average !== null && count > 0 ? (
          <StarRating value={average} count={count} size="md" />
        ) : (
          <p className="text-sm text-muted-foreground">No True Roof reviews yet.</p>
        )}
      </div>

      {listing.externalRating !== null ? (
        <p className="mt-3 text-sm text-muted-foreground">
          External average (staff estimate
          {listing.externalRatingSource
            ? `, ${listing.externalRatingSource}`
            : ""}
          ):{" "}
          <StarRating
            value={listing.externalRating}
            count={listing.externalRatingCount}
            labelPrefix="External"
            className="align-middle"
          />
          . Not a live Google sync.
        </p>
      ) : null}

      <div className="mt-8 rounded-xl border bg-card p-4 sm:p-5">
        <h3 className="font-medium">
          {ownReview ? "Update your review" : "Leave a review"}
        </h3>
        {!signedIn ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to leave a review for this site.
          </p>
        ) : (
          <form action={onSubmit} className="mt-4 space-y-4">
            <StarPicker defaultValue={ownReview?.stars ?? 0} />
            <div className="space-y-2">
              <label htmlFor="review-body" className="text-sm font-medium">
                Comment (optional)
              </label>
              <Textarea
                id="review-body"
                name="body"
                rows={3}
                maxLength={600}
                defaultValue={ownReview?.body ?? ""}
                placeholder="What should someone know before they go?"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {ownReview ? "Save changes" : "Post review"}
              </Button>
              {ownReview && ownReview.status !== "hidden" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={onWithdraw}
                >
                  Hide my review
                </Button>
              ) : null}
            </div>
            {ownReview?.status === "pending" ? (
              <p className="text-sm text-muted-foreground">
                Your review is waiting for a check before it shows publicly.
              </p>
            ) : null}
            {ownReview?.verifiedStay ? (
              <Badge variant="secondary">Visited</Badge>
            ) : null}
          </form>
        )}
      </div>

      <ul className="mt-8 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StarRating value={review.stars} />
              {review.verifiedStay ? (
                <Badge variant="secondary">Visited</Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            {review.body ? (
              <p className="mt-2 text-sm whitespace-pre-wrap">{review.body}</p>
            ) : null}
            <ReportButton reviewId={review.id} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ReportButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function onReport(formData: FormData) {
    setPending(true)
    formData.set("reviewId", reviewId)
    const result = await reportListingReview(formData)
    setPending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Report sent to site staff.")
    setOpen(false)
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => setOpen(true)}
      >
        Report
      </Button>
    )
  }

  return (
    <form action={onReport} className="mt-3 space-y-2">
      <Textarea
        name="reason"
        rows={2}
        required
        maxLength={200}
        placeholder="Why should staff look at this?"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Send report
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
