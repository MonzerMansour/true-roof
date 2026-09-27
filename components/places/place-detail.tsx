"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconHeart, IconHeartFilled } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { freshnessTone } from "@/components/places/place-card"
import { PlaceIntake } from "@/components/places/place-intake"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import {
  isFavorite,
  recordPlaceView,
  toggleFavorite,
} from "@/lib/listings/activity"
import { photoForListing } from "@/lib/listings/photos"
import { contactForListing } from "@/lib/listings/contacts"
import {
  couplesLabel,
  formatConfirmedAt,
  freshnessLabel,
  intakeLabel,
  parkingStatusLabel,
  petsLabel,
  type Listing,
} from "@/lib/listings/types"
import { listingFitsNeeds } from "@/lib/matching/hard-filters"
import { loadNeeds } from "@/lib/matching/storage"

const laterFields = [
  {
    label: "ID",
    body: "Whether this site requires ID will show here when staff set it.",
  },
  {
    label: "Intake hours",
    body: "Check-in window and curfew will show here when staff set them.",
  },
  {
    label: "Max stay",
    body: "How many nights you can stay will show here when staff set it.",
  },
]

export function PlaceDetail({
  listing,
  intent,
}: {
  listing: Listing
  intent?: string | null
}) {
  const router = useRouter()
  const photo = photoForListing(listing)
  const contact = contactForListing(listing)
  const tone = freshnessTone(listing)
  const status =
    listing.kind === "parking" && listing.parkingStatus
      ? parkingStatusLabel[listing.parkingStatus]
      : freshnessLabel[listing.freshness]
  const [fitMessage, setFitMessage] = React.useState<string | null>(null)
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
    if (!needs) return
    const fit = listingFitsNeeds(listing, needs)
    if (fit.fits) {
      setFitMessage("Fits what you told us.")
    } else {
      setFitMessage(fit.reasons.join(" "))
    }
  }, [listing])

  function onToggleSave() {
    const next = toggleFavorite(listing.id)
    setSaved(next)
    toast.success(next ? "Saved to your dashboard." : "Removed from saved.")
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="-ml-1 mb-4"
        aria-label="Back to Places"
        onClick={() => router.push("/places")}
      >
        <IconArrowLeft />
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <MarketingPhoto
          photo={photo}
          className="aspect-[16/10] rounded-xl"
          sizes="(min-width: 1024px) 55vw, 100vw"
          priority
        />
        <div className="mt-2">
          <PhotoCredit photo={photo} />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              tone === "live" && "bg-emerald-600 text-white",
              tone === "recent" && "bg-amber-500 text-white",
              tone === "call" && "bg-muted text-foreground"
            )}
          >
            {status}
          </Badge>
          <Badge variant="outline">
            {listing.kind === "parking" ? "Safe parking" : "Shelter"}
          </Badge>
          <Badge variant="outline">{intakeLabel[listing.intakeMethod]}</Badge>
        </div>

        <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {listing.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {listing.orgName}
          {" · "}
          {listing.city}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatConfirmedAt(listing.lastConfirmedAt)}. One freshness badge for
          the whole listing.
        </p>

        {fitMessage ? (
          <p className="mt-4 rounded-lg border bg-card p-3 text-sm">{fitMessage}</p>
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
            size="lg"
            onClick={onToggleSave}
          >
            {saved ? <IconHeartFilled /> : <IconHeart />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>

        <PlaceIntake listing={listing} intent={intent} />

        <dl className="mt-8 divide-y rounded-xl border bg-card">
          <DetailRow
            label="Pets"
            value={listing.pets ? petsLabel[listing.pets] : "Not published yet"}
          />
          <DetailRow
            label="Couples"
            value={
              listing.couples ? couplesLabel[listing.couples] : "Not published yet"
            }
          />
          {listing.kind === "parking" ? (
            <>
              <DetailRow
                label="Lot status"
                value={
                  listing.parkingStatus
                    ? parkingStatusLabel[listing.parkingStatus]
                    : "Not published yet"
                }
              />
              <DetailRow
                label="Vehicles"
                value={listing.vehicleNote ?? "Not published yet"}
              />
            </>
          ) : null}
          {listing.orgDescription ? (
            <DetailRow label="About the org" value={listing.orgDescription} />
          ) : null}
          {contact ? (
            <DetailRow label="Phone" value={contact.label} />
          ) : (
            <DetailRow
              label="Phone"
              value="A number to call will show here when the site publishes one."
              pending
            />
          )}
          {laterFields.map((field) => (
            <DetailRow
              key={field.label}
              label={field.label}
              value={field.body}
              pending
            />
          ))}
        </dl>

        <p className="mt-6 text-sm text-muted-foreground">
          Staff edit this row in the site portal. Publishing a listing puts it
          on this list. Featured placement on the homepage is separate.
        </p>
      </div>
      </div>
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
