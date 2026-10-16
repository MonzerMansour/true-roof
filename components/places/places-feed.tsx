"use client"

import * as React from "react"
import Link from "next/link"
import { IconFilter, IconMapPin, IconSearch, IconX } from "@tabler/icons-react"

import { PlaceCard } from "@/components/places/place-card"
import { PlaceCardEntrance } from "@/components/places/place-card-entrance"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "cn"
import { listingFitsNeeds } from "@/lib/matching/hard-filters"
import { suggestHouseholdSplit } from "@/lib/matching/household-split"
import { loadNeeds } from "@/lib/matching/storage"
import { useSession } from "@/components/auth/session-provider"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { FIND_A_PLACE_PATH } from "@/lib/matching/paths"
import type { SeekerNeeds } from "@/lib/matching/needs"
import type { RankSource } from "@/lib/matching/rank"
import type { MatchDetail } from "@/lib/matching/score-blend"
import {
  defaultOrigin,
  milesBetween,
  cityCenters,
  usableCoordinate,
} from "@/lib/listings/geo"
import {
  defaultPlaceFilters,
  isDefaultFilters,
  loadPlaceFilters,
  savePlaceFilters,
  type DistanceMiles,
  type PlaceFilters,
} from "@/lib/listings/place-filters"
import { freshnessLabel, intakeLabel, type Listing } from "@/lib/listings/types"
import { here4You } from "@/lib/listings/sources"

const distanceOptions: { value: DistanceMiles | null; label: string }[] = [
  { value: null, label: "Any distance" },
  { value: 2, label: "2 mi" },
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 20, label: "20 mi" },
]

/** Signed-out preview: about two rows on a three-column grid. */
const PREVIEW_LIMIT = 6

type FilterTag = {
  id: string
  label: string
  clear: () => void
}

export function PlacesFeed({
  listings,
  rankedBy,
  similarity,
  matchDetails,
}: {
  listings: Listing[]
  rankedBy: RankSource
  similarity?: Record<string, number>
  matchDetails?: Record<string, MatchDetail>
}) {
  const { session } = useSession()
  const [needs, setNeeds] = React.useState<SeekerNeeds | null>(null)
  const [filters, setFilters] =
    React.useState<PlaceFilters>(defaultPlaceFilters)
  const [geoError, setGeoError] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [filtersOpen, setFiltersOpen] = React.useState(false)

  React.useEffect(() => {
    const savedNeeds = loadNeeds()
    const savedFilters = loadPlaceFilters()
    setNeeds(savedNeeds)
    setFilters({
      ...savedFilters,
      onlyFits: savedNeeds ? savedFilters.onlyFits : false,
    })
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return
    savePlaceFilters(filters)
  }, [filters, ready])

  const origin = filters.origin ?? defaultOrigin

  const withMeta = listings.map((listing) => {
    // usableCoordinate, not a null check: (0, 0) is a real point in the Gulf
    // of Guinea and is what an unset column looks like, so a null check
    // rendered a shelter "7934 mi" away.
    const point = usableCoordinate(listing.lat, listing.lng)
    const miles = point ? milesBetween(origin, point) : null
    return {
      listing,
      fit: listingFitsNeeds(listing, needs),
      miles,
    }
  })

  const visible = withMeta
    .filter(({ listing, fit, miles }) => {
      if (filters.kind !== "all" && listing.kind !== filters.kind) return false
      if (filters.intake !== "all" && listing.intakeMethod !== filters.intake) {
        return false
      }
      if (
        filters.freshness !== "all" &&
        listing.freshness !== filters.freshness
      ) {
        return false
      }
      if (
        filters.hideFull &&
        listing.kind === "parking" &&
        listing.parkingStatus === "full"
      ) {
        return false
      }
      if (filters.onlyFits && needs && !fit.fits) return false
      if (filters.miles != null && (miles == null || miles > filters.miles)) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      // Sort by match score when the person has saved answers and the
      // server was able to rank by them. Anything without a score (should
      // not happen once ranked, but stay safe) sorts after everything
      // that has one. Falls back to nearest-first otherwise.
      if (rankedBy === "match_listings") {
        const aScore = matchDetails?.[a.listing.id]?.score
        const bScore = matchDetails?.[b.listing.id]?.score
        if (aScore != null || bScore != null) {
          if (aScore == null) return 1
          if (bScore == null) return -1
          return bScore - aScore
        }
      }

      if (a.miles == null && b.miles == null) return 0
      if (a.miles == null) return 1
      if (b.miles == null) return -1
      return a.miles - b.miles
    })

  const householdSplit =
    visible.length === 0
      ? suggestHouseholdSplit(
          withMeta.map(({ listing }) => listing),
          needs
        )
      : null

  function patch(next: Partial<PlaceFilters>) {
    setFilters((prev) => ({ ...prev, ...next }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("This phone cannot share a location.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoError(null)
        patch({
          origin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "Near me",
          },
        })
      },
      () => {
        setGeoError(
          "Location was blocked. Distance still uses downtown San Jose."
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }

  const cities = Array.from(new Set(listings.map((item) => item.city))).sort()

  const tags: FilterTag[] = []

  if (origin.label !== defaultOrigin.label) {
    tags.push({
      id: "origin",
      label: `From ${origin.label}`,
      clear: () => patch({ origin: defaultOrigin }),
    })
  }

  if (filters.miles != null) {
    tags.push({
      id: "miles",
      label: `Within ${filters.miles} mi`,
      clear: () => patch({ miles: null }),
    })
  }

  if (filters.kind === "shelter") {
    tags.push({
      id: "kind",
      label: "Shelters",
      clear: () => patch({ kind: "all" }),
    })
  } else if (filters.kind === "parking") {
    tags.push({
      id: "kind",
      label: "Safe parking",
      clear: () => patch({ kind: "all" }),
    })
  }

  if (filters.intake !== "all") {
    tags.push({
      id: "intake",
      label: intakeLabel[filters.intake],
      clear: () => patch({ intake: "all" }),
    })
  }

  if (filters.freshness !== "all") {
    tags.push({
      id: "freshness",
      label: freshnessLabel[filters.freshness],
      clear: () => patch({ freshness: "all" }),
    })
  }

  // Only when it is OFF. Hiding full lots is the default, so advertising it as
  // a filter the person applied put a chip and a badge on an untouched page,
  // and made Clear all look broken when the same default came back.
  if (filters.hasVehicle) {
    tags.push({
      id: "hasVehicle",
      label: "Safe parking first",
      clear: () => patch({ hasVehicle: false }),
    })
  }

  if (!filters.hideFull) {
    tags.push({
      id: "hideFull",
      label: "Including full lots",
      clear: () => patch({ hideFull: true }),
    })
  }

  if (filters.onlyFits && needs) {
    tags.push({
      id: "onlyFits",
      label: "Fits what you told us",
      clear: () => patch({ onlyFits: false }),
    })
  }

  const activeCount = tags.length
  const nothingToClear = isDefaultFilters(filters)

  // Fresh copy every time. Reusing the shared defaultPlaceFilters object made
  // React skip updates when Clear all was tapped after Near me / a city chip,
  // so linked locations looked stuck.
  function clearAll() {
    setFilters({
      ...defaultPlaceFilters,
      origin: { ...defaultOrigin },
    })
    setGeoError(null)
  }

  function clearLocations() {
    patch({ origin: { ...defaultOrigin }, miles: null })
    setGeoError(null)
  }

  const previewOnly = !session
  const shown = previewOnly ? visible.slice(0, PREVIEW_LIMIT) : visible
  const hiddenCount = previewOnly
    ? Math.max(0, visible.length - PREVIEW_LIMIT)
    : 0

  return (
    <div>
      <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border bg-card/80 p-2 shadow-sm ring-1 ring-primary/10 duration-500 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl bg-muted/60 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            aria-label="Open filters"
          >
            <IconSearch className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {activeCount > 0
                ? `${activeCount} filter${activeCount === 1 ? "" : "s"} · ${visible.length} sites`
                : "Filter shelters and safe parking…"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-background px-2 py-1 text-xs font-medium text-foreground ring-1 ring-border">
              <IconFilter className="size-3.5" />
              Filters
              {activeCount > 0 ? (
                <Badge variant="secondary" className="ml-0.5 h-5 px-1.5">
                  {activeCount}
                </Badge>
              ) : null}
            </span>
          </button>
          <Button
            type="button"
            size="sm"
            variant={origin.label === "Near me" ? "default" : "outline"}
            onClick={useMyLocation}
            className="min-h-11"
          >
            <IconMapPin />
            Near me
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1">
          <p className="text-sm text-muted-foreground">
            {previewOnly && hiddenCount > 0
              ? `Showing ${shown.length} of ${visible.length} sites`
              : `${visible.length} ${visible.length === 1 ? "site" : "sites"}`}
            {" · "}
            {rankedBy === "match_listings"
              ? "Best match first"
              : "Nearest first"}
          </p>
          {rankedBy === "match_listings" ? (
            <Badge variant="outline">Also ranked by your answers</Badge>
          ) : null}
        </div>
      </div>

      {geoError ? (
        <p className="mt-2 text-sm text-muted-foreground">{geoError}</p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={tag.clear}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
              aria-label={`Remove filter: ${tag.label}`}
            >
              {tag.label}
              <IconX className="size-3.5 opacity-70" />
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={nothingToClear}
            onClick={clearAll}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      {session && !needs ? (
        <Card className="mt-4 ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">
              Show only places that can take you
            </CardTitle>
            <CardDescription className="text-base">
              Ten quick questions about pets, ID, a partner, a car, and what
              time you can get there.
            </CardDescription>
            <div className="mt-3">
              <Link
                href={FIND_A_PLACE_PATH}
                className={cn(buttonVariants({ size: "touch" }))}
              >
                Answer the questions
              </Link>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md"
          showCloseButton
        >
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Narrow the list. Changes apply as you pick. Close with X or click
              outside.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FilterSection title="Location">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={origin.label === "Near me" ? "default" : "outline"}
                  onClick={useMyLocation}
                >
                  Near me
                </Button>
                {cities.map((city) => (
                  <Button
                    key={city}
                    type="button"
                    size="sm"
                    variant={origin.label === city ? "default" : "outline"}
                    onClick={() =>
                      patch({
                        origin: {
                          ...(cityCenters[city] ?? defaultOrigin),
                          label: city,
                        },
                      })
                    }
                  >
                    {city}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant={
                    origin.label === defaultOrigin.label ? "default" : "outline"
                  }
                  onClick={() => patch({ origin: { ...defaultOrigin } })}
                >
                  Downtown San Jose
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Measuring from {origin.label}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  disabled={
                    origin.label === defaultOrigin.label &&
                    filters.miles == null
                  }
                  onClick={clearLocations}
                >
                  Clear all linked locations
                </Button>
              </div>
            </FilterSection>

            <FilterSection title="Distance">
              <div className="flex flex-wrap gap-2">
                {distanceOptions.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    size="sm"
                    variant={
                      filters.miles === option.value ? "default" : "outline"
                    }
                    onClick={() => patch({ miles: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Type">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Shelters and lots"],
                    ["shelter", "Shelters"],
                    ["parking", "Safe parking"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={filters.kind === value ? "default" : "outline"}
                    onClick={() => patch({ kind: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="How you get in">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Any way in"],
                    ["call", intakeLabel.call],
                    ["waitlist", intakeLabel.waitlist],
                    ["register", intakeLabel.register],
                    ["walk_up", intakeLabel.walk_up],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={filters.intake === value ? "default" : "outline"}
                    onClick={() =>
                      patch({ intake: value as PlaceFilters["intake"] })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Freshness">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Any freshness"],
                    ["live", freshnessLabel.live],
                    ["recent", freshnessLabel.recent],
                    ["call_first", freshnessLabel.call_first],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={
                      filters.freshness === value ? "default" : "outline"
                    }
                    onClick={() =>
                      patch({
                        freshness: value as PlaceFilters["freshness"],
                      })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="More">
              <div className="grid gap-4">
                {/* Prioritises safe parking without hiding shelters, so
                    someone with a car still sees a bed when every lot is
                    full. */}
                <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
                  <span>I have a car or RV</span>
                  <Switch
                    checked={filters.hasVehicle}
                    onCheckedChange={(checked) =>
                      patch({ hasVehicle: checked })
                    }
                    aria-label="I have a car or RV. Shows safe parking first."
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Hide full lots</span>
                  <Switch
                    checked={filters.hideFull}
                    onCheckedChange={(checked) => patch({ hideFull: checked })}
                    aria-label="Hide full lots"
                  />
                </label>
                {needs ? (
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span>Only places that fit what you told us</span>
                    <Switch
                      checked={filters.onlyFits}
                      onCheckedChange={(checked) =>
                        patch({ onlyFits: checked })
                      }
                      aria-label="Only show places that fit what you told us"
                    />
                  </label>
                ) : session ? (
                  <Link
                    href={FIND_A_PLACE_PATH}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-fit"
                    )}
                    onClick={() => setFiltersOpen(false)}
                  >
                    Answer a few questions
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sign in to answer a few questions, and this filter can hide
                    places that cannot take you.
                  </p>
                )}
              </div>
            </FilterSection>
          </div>

          <SheetFooter className="border-t px-4 py-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={nothingToClear}
              onClick={clearAll}
            >
              Clear all
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => setFiltersOpen(false)}
            >
              See {visible.length} {visible.length === 1 ? "site" : "sites"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {visible.length === 0 ? (
        <Card className="mt-8 ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle>
              {householdSplit
                ? "No one site takes you both tonight"
                : "Nothing on this list can take you tonight"}
            </CardTitle>
            <CardDescription className="text-base">
              {householdSplit ? (
                <>
                  Two sites below can each take one person. If that will not
                  work, call {here4You.name} at{" "}
                  <a
                    className="font-medium underline"
                    href={`tel:${here4You.phone}`}
                  >
                    {here4You.display}
                  </a>
                  .
                </>
              ) : (
                <>
                  Call {here4You.name} at{" "}
                  <a
                    className="font-medium underline"
                    href={`tel:${here4You.phone}`}
                  >
                    {here4You.display}
                  </a>
                  . They place people into shelter across the county and can
                  look beyond this list. You can also open Filters and widen the
                  distance.
                </>
              )}
              <br />
              <br />
              Crisis lines stay separate:{" "}
              <a className="font-medium underline" href="tel:911">
                911
              </a>
              ,{" "}
              <a className="font-medium underline" href="tel:+18007997233">
                1-800-799-7233
              </a>
              , or{" "}
              <a className="font-medium underline" href="tel:988">
                988
              </a>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(({ listing, fit, miles }, index) => (
              <PlaceCardEntrance key={listing.id} index={index}>
                <PlaceCard
                  listing={listing}
                  fit={needs ? fit : undefined}
                  miles={miles}
                  matchPercent={
                    rankedBy === "match_listings"
                      ? similarity?.[listing.id]
                      : undefined
                  }
                  matchDetail={
                    rankedBy === "match_listings"
                      ? matchDetails?.[listing.id]
                      : undefined
                  }
                />
              </PlaceCardEntrance>
            ))}
          </div>

          {previewOnly && hiddenCount > 0 ? (
            <div className="relative mt-8">
              <div
                className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-transparent to-background"
                aria-hidden
              />
              <Card className="overflow-hidden ring-1 ring-primary/15">
                <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xl">
                    <CardTitle className="text-lg">
                      Sign in to see the rest
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {hiddenCount} more{" "}
                      {hiddenCount === 1 ? "site is" : "sites are"} waiting.
                      An account also unlocks matching: ten quick questions,
                      scores on every place, and sites that cannot take you drop
                      out. Calling and directions on the preview still work.
                    </CardDescription>
                  </div>
                  <SignInButton size="touch" next="/places">
                    Sign in to load more
                  </SignInButton>
                </CardHeader>
              </Card>
            </div>
          ) : null}
        </>
      )}

      {householdSplit && visible.length === 0 ? (
        <div className="mt-8 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Two places</p>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
              Stay on two sites instead of one compromise
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Each site can take one of you. Call both before you go. This is
              not a handoff.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                For you
              </p>
              <PlaceCard
                listing={householdSplit.yours}
                fit={householdSplit.yoursFit}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                For your partner
              </p>
              <PlaceCard
                listing={householdSplit.partner}
                fit={householdSplit.partnerFit}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Stands down while the guided tour is open. This bar is the
          thumb-reachable copy of the Filters button at the top of the feed,
          so nothing is lost by hiding it, and leaving it would have put the
          tour on top of the very button step 2 asks somebody to press. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/95 px-4 py-3 backdrop-blur sm:hidden [:root[data-tour-open]_&]:hidden">
        <Button
          type="button"
          size="touch"
          className="w-full"
          onClick={() => setFiltersOpen(true)}
        >
          <IconFilter />
          Filters
          {activeCount > 0 ? (
            <Badge variant="secondary" className="ml-0.5">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </div>
    </div>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}
