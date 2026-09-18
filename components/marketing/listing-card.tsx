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
    <Card
      className={cn(
        "min-w-[16rem] flex-1",
        onDark &&
          "border-white/15 bg-black/40 text-white ring-white/15 backdrop-blur-md"
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              listing.freshness === "live" || listing.parkingStatus === "open"
                ? "bg-emerald-500/90 text-white"
                : listing.freshness === "recent" ||
                    listing.parkingStatus === "waitlist"
                  ? "bg-amber-500/90 text-white"
                  : "bg-white/20 text-white",
              !onDark &&
                listing.freshness === "call_first" &&
                listing.parkingStatus !== "open" &&
                "bg-muted text-foreground"
            )}
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
      <CardContent className={cn("text-sm", onDark ? "text-white/80" : "text-muted-foreground")}>
        {isParking
          ? "Parking reads as open, full, or waitlist — not a bed-style freshness badge."
          : "One freshness badge for the whole listing. Hard filters already applied."}
      </CardContent>
    </Card>
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
