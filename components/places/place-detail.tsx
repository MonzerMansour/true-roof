"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconHeart,
  IconHeartFilled,
  IconPhoneCall,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { PlaceIntake } from "@/components/places/place-intake"
import { PlaceReviews } from "@/components/places/place-reviews"
import { StarRating } from "@/components/places/star-rating"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import {
  isFavorite,
  recordPlaceView,
  toggleFavorite,
} from "@/lib/listings/activity"
import { photoForListing } from "@/lib/listings/photos"
import { contactForListing } from "@/lib/listings/contacts"
import {
  coverageNote,
  sourceCitation,
  type PolicyField,
} from "@/lib/listings/sources"
import {
  couplesLabel,
  formatConfirmedAt,
  formatIntakeWindow,
  formatTime,
  freshnessLabel,
  freshnessTone,
  idRequiredLabel,
  intakeLabel,
  maxStayLabel,
  parkingStatusLabel,
  petsLabel,
  registrationRequiredLabel,
  vehicleAllowedLabel,
  type Listing,
  type ListingReview,
  type ListingReviewStats,
} from "@/lib/listings/types"
import { listingFitsNeeds, type FitResult } from "@/lib/matching/hard-filters"
import { loadNeeds } from "@/lib/matching/storage"

export function PlaceDetail({
  listing,
  intent,
  reviews = [],
  reviewStats = null,
  ownReview = null,
  signedIn = false,
}: {
  listing: Listing
  intent?: string | null
  reviews?: ListingReview[]
  reviewStats?: ListingReviewStats | null
  ownReview?: ListingReview | null
  signedIn?: boolean
}) {
  const photo = photoForListing(listing)
  const contact = contactForListing(listing)
  const isLot = listing.kind === "parking" && listing.parkingStatus
  const status = isLot
    ? parkingStatusLabel[listing.parkingStatus!]
    : freshnessLabel[listing.freshness]
  const tone = isLot
    ? listing.parkingStatus === "open"
      ? "success"
      : listing.parkingStatus === "waitlist"
        ? "warning"
        : "secondary"
    : freshnessTone(listing.freshness)
  const [fit, setFit] = React.useState<FitResult | null>(null)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    setSaved(isFavorite(listing.id))
    recordPlaceView({
      id: listing.id,
      name: listing.name,
      city: listing.city,
      kind: listing.kind,
    })
  }, [listing])

  React.useEffect(() => {
    const needs = loadNeeds()
    setFit(needs ? listingFitsNeeds(listing, needs) : null)
  }, [listing])

  function onToggleSave() {
    const next = toggleFavorite(listing.id)
    setSaved(next)
    toast.success(next ? "Saved to your dashboard." : "Removed from saved.")
  }

  /** A value, or the reason there is no value. The reason names which kind of
   * empty it is: a site that has not filled this in, or a source that does not
   * publish it at all. Replaces a hardcoded "will show here when staff set it"
   * placeholder that was the same sentence for both. */
  function rowFor(field: PolicyField, value: string | null) {
    if (value) return { value, pending: false }
    return {
      value: coverageNote(listing.dataSource, field),
      pending: true,
    }
  }

  const rows: { label: string; field: PolicyField; value: string | null }[] =
    listing.kind === "parking"
      ? [
          {
            label: "Vehicles",
            field: "vehicleAllowed",
            value: listing.vehicleAllowed
              ? vehicleAllowedLabel[listing.vehicleAllowed]
              : null,
          },
          {
            label: "Registration",
            field: "registrationRequired",
            value: listing.registrationRequired
              ? registrationRequiredLabel[listing.registrationRequired]
              : null,
          },
          {
            label: "Check-in hours",
            field: "intakeWindow",
            value:
              listing.intakeFrom && listing.intakeTo
                ? formatIntakeWindow(listing.intakeFrom, listing.intakeTo)
                : null,
          },
          {
            label: "Address",
            field: "address",
            value: listing.address,
          },
        ]
      : [
          {
            label: "Pets",
            field: "pets",
            value: listing.pets
              ? listing.pets === "small_pets" && listing.petWeightLimitLbs
                ? `Small pets, up to ${listing.petWeightLimitLbs} lb`
                : petsLabel[listing.pets]
              : null,
          },
          {
            label: "Couples",
            field: "couples",
            value: listing.couples ? couplesLabel[listing.couples] : null,
          },
          {
            label: "ID",
            field: "idRequired",
            value: listing.idRequired
              ? idRequiredLabel[listing.idRequired]
              : null,
          },
          {
            label: "Check-in hours",
            field: "intakeWindow",
            value:
              listing.intakeFrom && listing.intakeTo
                ? formatIntakeWindow(listing.intakeFrom, listing.intakeTo)
                : null,
          },
          {
            label: "Curfew",
            field: "curfew",
            value:
              listing.curfewPolicy === "no_curfew"
                ? "No curfew"
                : listing.curfewPolicy === "fixed_time" && listing.curfewTime
                  ? `Doors lock at ${formatTime(listing.curfewTime)}`
                  : null,
          },
          {
            label: "Longest stay",
            field: "maxStay",
            value: listing.maxStay ? maxStayLabel[listing.maxStay] : null,
          },
          {
            label: "Address",
            field: "address",
            value: listing.address,
          },
        ]

  const citation = sourceCitation(listing.dataSource, listing.sourceAsOf)

  return (
    <div>
      {/* A real link, not router.push on a Button, so middle click and the
          context menu work. */}
      <Button
        variant="ghost"
        size="touch"
        className="mb-4 -ml-1"
        render={<Link href="/places" />}
      >
        <IconArrowLeft />
        All places
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <MarketingPhoto
            photo={photo}
            className="aspect-[16/10] rounded-2xl ring-1 ring-primary/15"
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
          />
          <div className="mt-2">
            <PhotoCredit photo={photo} />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={tone}>{status}</Badge>
            <Badge variant="outline">
              {listing.kind === "parking" ? "Safe parking" : "Shelter"}
            </Badge>
            <Badge variant="outline">{intakeLabel[listing.intakeMethod]}</Badge>
          </div>

          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {listing.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {listing.orgName}
            {" · "}
            {listing.city}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatConfirmedAt(listing.lastConfirmedAt)}
          </p>
          {listing.description ? (
            <p className="mt-4 max-w-2xl whitespace-pre-line">
              {listing.description}
            </p>
          ) : null}
          {reviewStats && reviewStats.reviewCount > 0 ? (
            <div className="mt-3">
              <StarRating
                value={reviewStats.averageStars}
                count={reviewStats.reviewCount}
                size="md"
              />
            </div>
          ) : null}

          {fit ? (
            // FitResult is the two-value shape again: { fits, reasons }. The
            // three-value verdict belonged to the ranking approach that was
            // dropped in favour of the embeddings matcher.
            <div
              className="mt-4 rounded-xl border bg-card p-3 text-sm ring-1 ring-primary/10"
              aria-live="polite"
            >
              {fit.fits ? (
                <p className="font-medium text-success-text">
                  Nothing you told us rules this one out.
                </p>
              ) : (
                <>
                  <p className="font-medium text-destructive">
                    This one does not fit.
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {fit.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm">
              <Link
                href="/get-started/find-a-place"
                className="font-medium underline"
              >
                Answer a few questions
              </Link>{" "}
              so we can mark what fits.
            </p>
          )}

          <div className="mt-4">
            <Button
              type="button"
              variant={saved ? "secondary" : "outline"}
              size="touch"
              aria-pressed={saved}
              onClick={onToggleSave}
            >
              {saved ? <IconHeartFilled /> : <IconHeart />}
              {saved ? "Saved" : "Save"}
            </Button>
          </div>

          <PlaceIntake listing={listing} intent={intent} />

          <dl className="mt-8 divide-y rounded-xl border bg-card">
            {rows.map((row) => {
              const resolved = rowFor(row.field, row.value)
              return (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  value={resolved.value}
                  pending={resolved.pending}
                />
              )
            })}
            {/* What a lot is actually like to use. These are the questions
                people ask before driving anywhere, and until the operations
                columns existed they could only live in free text where nothing
                could show them separately. Each renders only when the operator
                published it. */}
            {listing.costNote ? (
              <DetailRow label="Cost" value={listing.costNote} />
            ) : null}
            {listing.facilitiesNote ? (
              <DetailRow
                label="Toilets and showers"
                value={listing.facilitiesNote}
              />
            ) : null}
            {listing.securityNote ? (
              <DetailRow label="Security" value={listing.securityNote} />
            ) : null}
            {listing.petsNote ? (
              <DetailRow label="Pets" value={listing.petsNote} />
            ) : null}
            {listing.maxStayNote ? (
              <DetailRow
                label="How long you can stay"
                value={listing.maxStayNote}
              />
            ) : null}
            {listing.waitlistNote ? (
              <DetailRow label="Waitlist" value={listing.waitlistNote} />
            ) : null}
            {listing.screeningNote ? (
              <DetailRow label="How you get in" value={listing.screeningNote} />
            ) : null}
            {listing.kind === "parking" && listing.vehicleNote ? (
              <DetailRow label="Lot notes" value={listing.vehicleNote} />
            ) : null}
            {listing.orgDescription ? (
              <DetailRow label="About the org" value={listing.orgDescription} />
            ) : null}
            <DetailRow
              label="Phone"
              value={
                contact
                  ? contact.isReferralLine
                    ? `${contact.label}. ${contact.note}`
                    : contact.label
                  : coverageNote(listing.dataSource, "phone")
              }
              pending={!contact}
            />
          </dl>

          {/* A checklist, not a paragraph. "What do I have to bring" is the
              question that stops people applying, and it is worked through one
              item at a time. */}
          {listing.requiresDocuments && listing.requiresDocuments.length > 0 ? (
            <section
              aria-labelledby="documents-heading"
              className="mt-6 rounded-xl border bg-card p-4"
            >
              <h2
                id="documents-heading"
                className="font-heading text-base font-semibold"
              >
                What to bring
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {listing.requiresDocuments.length} things this site asks for.
                Call them if any of these are hard to get: operators often help.
              </p>
              <ul className="mt-3 grid gap-2">
                {listing.requiresDocuments.map((document) => (
                  <li key={document} className="flex gap-2 text-sm">
                    <span aria-hidden className="text-muted-foreground">
                      &bull;
                    </span>
                    <span>{document}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {citation ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Source: {citation}{" "}
              {listing.sourceUrl ? (
                <a
                  className="font-medium underline"
                  href={listing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  See the original
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>

      <PlaceReviews
        listing={listing}
        reviews={reviews}
        stats={reviewStats}
        ownReview={ownReview}
        signedIn={signedIn}
      />

      {/* The page is about 2,000px on a phone. Calling is the whole point of
          reading it, and the call button scrolls away exactly while someone is
          reading the rules that make them want to call. This keeps it under a
          thumb. Phone only, and only when there is a number to ring. */}
      {contact ? (
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
          <a
            href={`tel:${contact.tel}`}
            className={cn(buttonVariants({ size: "touch" }), "w-full")}
          >
            <IconPhoneCall />
            Call {contact.label}
          </a>
          {contact.isReferralLine ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              County shelter line, not this site&apos;s own number.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function DetailRow({
  label,
  value,
  pending,
}: {
  label: string
  value: string
  pending?: boolean
}) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr] sm:items-start">
      <dt className="text-sm font-medium">{label}</dt>
      <dd
        className={cn(
          "text-sm",
          pending ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
