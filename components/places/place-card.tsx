"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCheck,
  IconChevronDown,
  IconHeart,
  IconHeartFilled,
  IconX,
} from "@tabler/icons-react"
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
import { cn } from "cn"
import {
  isFavorite,
  subscribeActivity,
  toggleFavorite,
} from "@/lib/listings/activity"
import { contactForListing } from "@/lib/listings/contacts"
import { formatMiles } from "@/lib/listings/geo"
import { photoForListing } from "@/lib/listings/photos"
import {
  couplesLabel,
  formatConfirmedAt,
  freshnessLabel,
  intakeLabel,
  parkingStatusLabel,
  petsLabel,
  type Listing,
} from "@/lib/listings/types"
import type { MatchDetail } from "@/lib/matching/score-blend"
import { formatPercent, lenientTextScore } from "@/lib/matching/score-blend"
import { MatchAnalytics } from "@/components/places/match-analytics"
import { useDeveloperMode } from "@/lib/dev-mode"

export function freshnessTone(listing: Listing) {
  if (listing.kind === "parking") {
    if (listing.parkingStatus === "open") return "live"
    if (listing.parkingStatus === "waitlist") return "recent"
    return "call"
  }

  if (listing.freshness === "live") return "live"
  if (listing.freshness === "recent") return "recent"
  return "call"
}

export function PlaceCard({
  listing,
  fit,
  miles,
  matchPercent,
  matchDetail,
}: {
  listing: Listing
  fit?: { fits: boolean; reasons: string[] }
  miles?: number | null
  /**
   * 0-1 cosine similarity from match_listings(), the same value used to
   * order the feed. Shown as a rounded percentage, not a claim of fit,
   * only how close the wording of their answers landed to this listing.
   */
  matchPercent?: number
  /**
   * Display-only breakdown behind the match badge: how the structured
   * fields agree, how close the text is, and which answers drove each
   * factor. Opening it never changes list order, match_listings' cosine
   * score does that alone, this only explains the number.
   */
  matchDetail?: MatchDetail
}) {
  const photo = photoForListing(listing)
  const contact = contactForListing(listing)
  const tone = freshnessTone(listing)
  const status =
    listing.kind === "parking" && listing.parkingStatus
      ? parkingStatusLabel[listing.parkingStatus]
      : freshnessLabel[listing.freshness]
  const [saved, setSaved] = React.useState(false)
  const [showBreakdown, setShowBreakdown] = React.useState(false)
  const developerMode = useDeveloperMode()

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

  function onToggleSave(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const next = toggleFavorite(listing.id)
    setSaved(next)
    toast.success(next ? "Saved to your dashboard." : "Removed from saved.")
  }

  function onToggleBreakdown(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setShowBreakdown((prev) => !prev)
  }

  return (
    <Link href={`/places/${listing.id}`} className="block h-full">
      <Card className="relative h-full overflow-hidden transition-colors hover:bg-muted/40">
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
            className="absolute top-2 right-2 rounded-full bg-background/90 shadow-sm backdrop-blur-sm"
            aria-label={saved ? "Remove from saved" : "Save place"}
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
            {fit && !fit.fits ? (
              <Badge variant="destructive">May not fit</Badge>
            ) : null}
            {fit?.fits ? (
              <Badge variant="secondary">Fits what you told us</Badge>
            ) : null}
            {matchPercent != null && matchDetail ? (
              <button
                type="button"
                onClick={onToggleBreakdown}
                aria-expanded={showBreakdown}
                className="inline-flex items-center gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium outline-none transition-all hover:border-border focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Badge variant="outline" className="border-none px-0">
                  {formatPercent(matchDetail.score)} match to your answers
                </Badge>
                <IconChevronDown
                  className={cn(
                    "size-3 text-muted-foreground transition-transform",
                    showBreakdown && "rotate-180"
                  )}
                />
              </button>
            ) : matchPercent != null ? (
              <Badge variant="outline">
                {formatPercent(matchPercent)} match to your answers
              </Badge>
            ) : null}
            <Badge variant="outline">{intakeLabel[listing.intakeMethod]}</Badge>
            {miles != null ? (
              <Badge variant="outline">{formatMiles(miles)}</Badge>
            ) : null}
            {saved ? (
              <Badge variant="secondary" className="gap-1">
                <IconHeartFilled className="size-3" />
                Saved
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-xl">{listing.name}</CardTitle>
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
          {listing.description || listing.orgDescription ? (
            <p className="line-clamp-3 text-sm">
              {listing.description || listing.orgDescription}
            </p>
          ) : null}
          {contact ? (
            <p className="text-sm font-medium">{contact.label}</p>
          ) : null}
          {fit && !fit.fits && fit.reasons[0] ? (
            <p className="text-sm text-destructive">{fit.reasons[0]}</p>
          ) : null}
          {showBreakdown && matchDetail ? (
            <div
              className="space-y-2 rounded-lg border p-3"
              onClick={(event) => event.preventDefault()}
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {formatPercent(matchDetail.categorical)} fields
                </Badge>
                <Badge variant="outline">
                  {formatPercent(lenientTextScore(matchDetail.cosine))} text
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {matchDetail.factors.map((factor) => (
                  <li
                    key={factor.label}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {factor.label}:
                      </span>{" "}
                      {factor.detail}
                    </span>
                    <Badge
                      variant={factor.score >= 0.7 ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {factor.score >= 0.7 ? (
                        <IconCheck className="size-3" aria-label="Matches" />
                      ) : (
                        <IconX className="size-3" aria-label="Does not match" />
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
              {developerMode ? (
                <MatchAnalytics
                  listingId={listing.id}
                  cosine={matchDetail.cosine}
                  categorical={matchDetail.categorical}
                  score={matchDetail.score}
                />
              ) : null}
            </div>
          ) : null}
          <PhotoCredit photo={photo} />
        </CardContent>
      </Card>
    </Link>
  )
}
