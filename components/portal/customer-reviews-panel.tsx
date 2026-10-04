"use client"

import * as React from "react"
import { toast } from "sonner"

import { StarPicker, StarRating } from "@/components/places/star-rating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  hideCustomerReview,
  upsertCustomerReview,
} from "@/lib/portal/actions"
import type { CustomerReview, InterestKind } from "@/lib/listings/types"
import { interestLabel } from "@/lib/listings/types"

type InterestItem = {
  id: string
  user_id: string
  kind: InterestKind
  created_at: string
}

export function CustomerReviewsPanel({
  listingId,
  interest,
  reviews,
  reportCounts,
  canManage,
}: {
  listingId: string
  interest: InterestItem[]
  reviews: CustomerReview[]
  reportCounts: Map<string, number> | Record<string, number>
  canManage: boolean
}) {
  const counts =
    reportCounts instanceof Map
      ? reportCounts
      : new Map(Object.entries(reportCounts))

  async function onSubmit(formData: FormData) {
    formData.set("listingId", listingId)
    const result = await upsertCustomerReview(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Customer note saved. Seekers never see this score.")
  }

  async function onHide(formData: FormData) {
    formData.set("listingId", listingId)
    const result = await hideCustomerReview(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Updated.")
  }

  return (
    <section className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">
          Notes on people who asked
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          If someone tanks this listing on purpose, leave a private note here.
          It is a staff record only. It is never a public score.
        </p>
      </div>

      {canManage && interest.length > 0 ? (
        <form action={onSubmit} className="space-y-3 rounded-lg border p-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Person</span>
            <select
              name="subjectUserId"
              required
              className="h-10 rounded-lg border bg-background px-3"
              defaultValue=""
            >
              <option value="" disabled>
                Pick someone who asked
              </option>
              {interest.map((row) => (
                <option key={row.id} value={row.user_id}>
                  {interestLabel[row.kind]} · {row.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <StarPicker />
          <Textarea
            name="body"
            rows={3}
            maxLength={600}
            placeholder="What happened. Stick to facts."
          />
          <Button type="submit" size="sm">
            Save private note
          </Button>
        </form>
      ) : null}

      {canManage && interest.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Notes can be added once someone joins a waitlist or asks for a bed.
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customer notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const reports = counts.get(review.id) ?? 0
            return (
              <li key={review.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating value={review.stars} />
                  <Badge variant="outline">{review.status}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {review.subjectUserId.slice(0, 8)}
                  </span>
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
                {canManage ? (
                  <form action={onHide} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="reviewId" value={review.id} />
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
                      value="published"
                      size="sm"
                      variant="outline"
                    >
                      Keep
                    </Button>
                  </form>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
