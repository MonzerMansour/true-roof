import Image from "next/image"
import Link from "next/link"

import { StarRating } from "@/components/places/star-rating"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "cn"
import {
  couplesLabel,
  formatConfirmedAt,
  freshnessLabel,
  parkingStatusLabel,
  petsLabel,
  type Listing,
} from "@/lib/listings/types"

export function ListingCard({
  listing,
  variant = "default",
}: {
  listing: Listing
  variant?: "default" | "onDark"
}) {
  const onDark = variant === "onDark"
  const isParking = listing.kind === "parking"
  const badgeText = isParking
    ? listing.parkingStatus
      ? parkingStatusLabel[listing.parkingStatus]
      : freshnessLabel[listing.freshness]
    : freshnessLabel[listing.freshness]

  const details = [
    listing.city,
    listing.pets ? petsLabel[listing.pets] : null,
    listing.couples ? couplesLabel[listing.couples] : null,
    listing.vehicleNote,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link href={`/places/${listing.id}`} className="block h-full">
      <Card
        className={cn(
          "min-w-[16rem] flex-1 ring-1 ring-primary/10 transition-colors hover:bg-muted/30",
          onDark &&
            "border-white/15 bg-black/40 text-white ring-white/15 backdrop-blur-md hover:bg-black/50"
        )}
      >
        {/* Only a photo the site's staff uploaded. No stock photo here: the
          homepage hero already has one behind these cards. */}
        {listing.photoUrl ? (
          <div className="relative h-28 overflow-hidden">
            <Image
              src={listing.photoUrl}
              alt={`Photo of ${listing.name}`}
              fill
              sizes="(min-width: 1024px) 20rem, 80vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <CardHeader>
          <div className="flex items-center gap-2">
            {/* Theme tokens, measured for contrast in both themes. These were
              bg-emerald-500/90 and bg-amber-500/90 with white text, which
              measured 3.77:1 and 2.15:1. AA needs 4.5:1. */}
            <Badge
              variant={
                listing.freshness === "live" || listing.parkingStatus === "open"
                  ? "success"
                  : listing.freshness === "recent" ||
                      listing.parkingStatus === "waitlist"
                    ? "warning"
                    : "secondary"
              }
            >
              {badgeText}
            </Badge>
            <CardTitle className={cn(onDark && "text-white")}>
              {listing.name}
            </CardTitle>
          </div>
          <CardDescription className={cn(onDark && "text-white/70")}>
            {formatConfirmedAt(listing.lastConfirmedAt)}
            {details ? ` · ${details}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn(
            "text-sm",
            onDark ? "text-white/80" : "text-muted-foreground"
          )}
        >
          {listing.description ? (
            <span className="line-clamp-2">{listing.description}</span>
          ) : isParking
            ? "Parking reads as open, full, or waitlist. Not a bed-style freshness badge."
            : "One freshness badge for the whole listing. Hard filters already applied."}
        </CardContent>
      </Card>
    </Link>
  )
}

export function ListingCardRow({
  listings,
  variant = "default",
}: {
  listings: Listing[]
  variant?: "default" | "onDark"
}) {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-1">
      {listings.map((listing) => (
        <div key={listing.id} className="snap-start">
          <ListingCard listing={listing} variant={variant} />
        </div>
      ))}
    </div>
  )
}
