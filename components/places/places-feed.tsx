"use client"

import * as React from "react"
import Link from "next/link"
import { IconFilter, IconX } from "@tabler/icons-react"

import { PlaceCard } from "@/components/places/place-card"
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
import { loadNeeds } from "@/lib/matching/storage"
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

const distanceOptions: { value: DistanceMiles | null; label: string }[] = [
  { value: null, label: "Any distance" },
  { value: 2, label: "2 mi" },
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 20, label: "20 mi" },
]

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

  // One function for both controls, which used to be two inline calls under
  // two different labels.
  function clearAll() {
    setFilters(defaultPlaceFilters)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
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
        <Button
          type="button"
          size="sm"
          variant={origin.label === "Near me" ? "default" : "outline"}
          onClick={useMyLocation}
        >
          Near me
        </Button>
        <p className="text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "site" : "sites"}
          {" · "}
          {rankedBy === "match_listings" ? "Best match first" : "Nearest first"}
        </p>
        {rankedBy === "match_listings" ? (
          <Badge variant="outline">Also ranked by your answers</Badge>
        ) : null}
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

      {!needs ? (
        <Card className="mt-4 ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">
              Show only places that can take you
            </CardTitle>
            <CardDescription className="text-base">
              Ten quick questions about pets, ID, a partner, a car, and what
              time you can get there. No account needed, and your answers stay
              on this phone.
            </CardDescription>
            <div className="mt-3">
              <Link
                href="/get-started/find-a-place"
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
                  onClick={() => patch({ origin: defaultOrigin })}
                >
                  Downtown San Jose
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Measuring from {origin.label}
              </p>
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
                ) : (
                  <Link
                    href="/get-started/find-a-place"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-fit"
                    )}
                    onClick={() => setFiltersOpen(false)}
                  >
                    Answer a few questions
                  </Link>
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
            <CardTitle>Nothing on this list fits</CardTitle>
            <CardDescription className="text-base">
              Open Filters and widen the distance, or clear a tag above. Crisis
              lines stay separate:{" "}
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ listing, fit, miles }) => (
            <PlaceCard
              key={listing.id}
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
          ))}
        </div>
      )}

      {hidden.length > 0 ? (
        <div className="mt-8">
          <Button
            type="button"
            size="touch"
            variant="outline"
            aria-expanded={showHidden}
            onClick={() => setShowHidden((open) => !open)}
          >
            {showHidden ? "Hide" : "Show"} {hidden.length}{" "}
            {hidden.length === 1 ? "place" : "places"} hidden by your answers
          </Button>
          {showHidden ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hidden.map(({ listing, fit, rank }) => (
                <PlaceCard
                  key={listing.id}
                  listing={listing}
                  fit={fit}
                  miles={rank.miles}
                  basis={rank.basis}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {unplaceable.length > 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-4 ring-1 ring-primary/10">
          <h2 className="font-heading text-base font-semibold">
            {unplaceable.length}{" "}
            {unplaceable.length === 1 ? "place has" : "places have"} no address
            on file
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The county bed count these came from does not publish addresses, so
            they cannot be measured against a distance. Clear the distance
            filter to see them, or call {here4You.name} at{" "}
            <a className="font-medium underline" href={`tel:${here4You.phone}`}>
              {here4You.display}
            </a>
            .
          </p>
        </div>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
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
