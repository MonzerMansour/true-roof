"use client"

import * as React from "react"
import Link from "next/link"
import { IconHeart, IconHeartFilled } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  isFavorite,
  subscribeActivity,
  toggleFavorite,
} from "@/lib/listings/activity"
import { contactForListing } from "@/lib/listings/contacts"
import { formatDistance, type DistanceBasis } from "@/lib/listings/geo"
import { photoForListing } from "@/lib/listings/photos"
import { policyFieldLabel } from "@/lib/listings/sources"
import {
  couplesLabel,
  formatConfirmedAt,
  freshnessLabel,
  freshnessTone,
  intakeLabel,
  parkingStatusLabel,
  petsLabel,
  type Listing,
} from "@/lib/listings/types"
import type { FitResult } from "@/lib/matching/hard-filters"

export function PlaceCard({
  listing,
  fit,
  miles,
  basis = "unknown",
}: {
  listing: Listing
  fit?: FitResult
  miles?: number | null
  basis?: DistanceBasis
}) {
  const photo = photoForListing(listing)
  const contact = contactForListing(listing)
  const [saved, setSaved] = React.useState(false)
  const titleId = React.useId()

  // A parking lot reads its status; a shelter reads its freshness badge. Both
  // always carry text, never colour alone.
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

  React.useEffect(() => {
    const sync = () => setSaved(isFavorite(listing.id))
    sync()
    return subscribeActivity(sync)
  }, [listing.id])

  const facts = [
    listing.city,
    listing.pets ? petsLabel[listing.pets] : null,
    listing.couples ? couplesLabel[listing.couples] : null,
    listing.vehicleNote,
  ].filter(Boolean)

  function onToggleSave() {
    const next = toggleFavorite(listing.id)
    setSaved(next)
    toast.success(next ? "Saved to your dashboard." : "Removed from saved.")
  }

  return (
    // An <article> holding one link and one button, rather than a <Link> wrapped
    // around the whole card with a <Button> inside it. Interactive content
    // inside an <a> is invalid HTML, it made the card's accessible name the
    // entire card text, and the save button only worked because of
    // preventDefault. The title's stretched ::after keeps the whole card
    // tappable, and the save button sits above it with z-10.
    <article
      aria-labelledby={titleId}
      className="relative h-full rounded-xl [&:has(a:focus-visible)]:ring-3 [&:has(a:focus-visible)]:ring-ring/50"
    >
      <Card className="h-full overflow-hidden transition-colors hover:bg-muted/40">
        <div className="relative">
          <MarketingPhoto
            photo={photo}
            className="h-44"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2 z-10 rounded-full bg-background/90 shadow-sm backdrop-blur-sm"
            aria-label={
              saved
                ? `Remove ${listing.name} from saved`
                : `Save ${listing.name}`
            }
            aria-pressed={saved}
            onClick={onToggleSave}
          >
            {saved ? (
              <IconHeartFilled className="text-primary" />
            ) : (
              <IconHeart />
            )}
          </Button>
        </div>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={tone}>{status}</Badge>
            <Badge variant="outline">
              {listing.kind === "parking" ? "Safe parking" : "Shelter"}
            </Badge>
            {fit?.verdict === "excluded" ? (
              <Badge variant="destructive">Does not fit</Badge>
            ) : null}
            {fit?.verdict === "fits" ? (
              <Badge variant="success">Fits what you told us</Badge>
            ) : null}
            {fit?.verdict === "unknown" ? (
              <Badge variant="secondary">Some rules not listed</Badge>
            ) : null}
            <Badge variant="outline">{intakeLabel[listing.intakeMethod]}</Badge>
            {miles != null ? (
              <Badge variant="outline">
                {formatDistance(miles, basis, listing.city)}
              </Badge>
            ) : null}
            {saved ? (
              <Badge variant="secondary" className="gap-1">
                <IconHeartFilled className="size-3" />
                Saved
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-xl">
            <Link
              href={`/places/${listing.id}`}
              id={titleId}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {listing.name}
            </Link>
          </CardTitle>
          <CardDescription>
            {listing.orgName}
            {" · "}
            {formatConfirmedAt(listing.lastConfirmedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-6">
          {facts.length > 0 ? (
            <p className="text-sm text-muted-foreground">{facts.join(" · ")}</p>
          ) : null}
          {contact ? (
            <p className="text-sm font-medium">
              {contact.label}
              {contact.isReferralLine ? (
                <span className="font-normal text-muted-foreground">
                  {" · county shelter line"}
                </span>
              ) : null}
            </p>
          ) : null}
          {fit?.verdict === "excluded" && fit.reasons[0] ? (
            <p className="text-sm text-destructive">{fit.reasons[0]}</p>
          ) : null}
          {fit?.verdict !== "excluded" && fit?.notes[0] ? (
            <p className="text-sm text-warning-text">{fit.notes[0]}</p>
          ) : null}
          {fit?.verdict === "unknown" && fit.unknowns.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Not listed:{" "}
              {fit.unknowns
                .map((field) => policyFieldLabel[field].toLowerCase())
                .join(", ")}
              . Call to check.
            </p>
          ) : null}
          <PhotoCredit photo={photo} />
        </CardContent>
      </Card>
    </article>
  )
}
