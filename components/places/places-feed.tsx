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
import { rankByDistanceAndFreshness } from "@/lib/matching/score"
import { loadNeeds } from "@/lib/matching/storage"
import type { SeekerNeeds } from "@/lib/matching/needs"
import type { RankSource } from "@/lib/matching/rank"
import { cityCenters, defaultOrigin } from "@/lib/listings/geo"
import { here4You, unknownCity } from "@/lib/listings/sources"
import {
  defaultPlaceFilters,
  fitFilterLabel,
  isDefaultFilters,
  loadPlaceFilters,
  savePlaceFilters,
  type DistanceMiles,
  type FitFilter,
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

const fitOptions: FitFilter[] = ["possible", "confirmed", "all"]

type FilterTag = {
  id: string
  label: string
  clear: () => void
}

export function PlacesFeed({
  listings,
  rankedBy,
}: {
  listings: Listing[]
  rankedBy: RankSource
}) {
  const [needs, setNeeds] = React.useState<SeekerNeeds | null>(null)
  const [filters, setFilters] =
    React.useState<PlaceFilters>(defaultPlaceFilters)
  const [geoError, setGeoError] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [showHidden, setShowHidden] = React.useState(false)

  React.useEffect(() => {
    setNeeds(loadNeeds())
    setFilters(loadPlaceFilters())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return
    savePlaceFilters(filters)
  }, [filters, ready])

  const origin = filters.origin ?? defaultOrigin

  // The server hands `listings` in embedding order when the person has answers
  // embedded. Capture that order before re-sorting, so it can break ties rather
  // than being thrown away. The feed used to overwrite it with a pure distance
  // sort while still showing a badge claiming it had been used.
  const embeddingRank = React.useMemo(
    () => new Map(listings.map((listing, index) => [listing.id, index])),
    [listings]
  )

  // Closest and freshest first. One ranking function, in lib/matching/score.ts.
  const ranked = React.useMemo(
    () => rankByDistanceAndFreshness(listings, origin, { embeddingRank }),
    [listings, origin, embeddingRank]
  )

  const withMeta = React.useMemo(
    () =>
      ranked.map(({ listing, rank }) => ({
        listing,
        rank,
        fit: listingFitsNeeds(listing, needs),
      })),
    [ranked, needs]
  )

  // Day-of filters the person chose explicitly. These are separate from hard
  // constraints and always apply.
  const chosen = withMeta.filter(({ listing }) => {
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
    return true
  })

  // A distance filter cannot judge a site whose position is unknown, and most
  // rows come from a source that publishes no addresses. Dropping them silently
  // would hide most of the county behind a filter about miles, so they are held
  // back and offered separately instead.
  const unplaceable =
    filters.miles != null ? chosen.filter(({ rank }) => rank.miles == null) : []
  const withinDistance =
    filters.miles == null
      ? chosen
      : chosen.filter(
          ({ rank }) => rank.miles != null && rank.miles <= filters.miles!
        )

  const keepsFit = (verdict: "fits" | "unknown" | "excluded") => {
    if (!needs) return true
    if (filters.fit === "all") return true
    if (filters.fit === "confirmed") return verdict === "fits"
    return verdict !== "excluded"
  }

  const visible = withinDistance.filter(({ fit }) => keepsFit(fit.verdict))
  // Removed by a hard constraint. Product rule: they stay one tap away, with
  // the reason.
  const hidden = withinDistance.filter(
    ({ fit }) => needs && fit.verdict === "excluded" && !keepsFit(fit.verdict)
  )

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

  // Only real cities can be an origin. unknownCity means the source did not say
  // where the site is, so it has no centre to measure from.
  const cities = Array.from(new Set(listings.map((item) => item.city)))
    .filter((city) => city !== unknownCity && cityCenters[city])
    .sort()

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
  // a filter the person applied put a chip and a badge on an untouched page and
  // made Clear all look broken when the default came back.
  if (!filters.hideFull) {
    tags.push({
      id: "hideFull",
      label: "Including full lots",
      clear: () => patch({ hideFull: true }),
    })
  }

  if (needs && filters.fit !== "possible") {
    tags.push({
      id: "fit",
      label: fitFilterLabel[filters.fit],
      clear: () => patch({ fit: "possible" }),
    })
  }

  const activeCount = tags.length
  const nothingToClear = isDefaultFilters(filters)

  // One function for both controls. They used to be two inline calls with two
  // different labels, and neither reset the revealed set.
  function clearAll() {
    setFilters(defaultPlaceFilters)
    setShowHidden(false)
  }
  const countText = `${visible.length} ${visible.length === 1 ? "place" : "places"}. Closest and freshest first.`

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="touch"
          variant="outline"
          className="hidden sm:inline-flex"
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
          size="touch"
          variant={origin.label === "Near me" ? "default" : "outline"}
          aria-pressed={origin.label === "Near me"}
          onClick={useMyLocation}
        >
          Near me
        </Button>
        {/* Announced when a filter changes the result count. Nothing used to
            tell a screen reader the list had changed at all. */}
        <p
          className="text-sm text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {countText}
        </p>
        {rankedBy === "match_listings" ? (
          <Badge variant="outline">Your answers break ties</Badge>
        ) : null}
      </div>

      {geoError ? (
        <p className="mt-2 text-sm text-muted-foreground">{geoError}</p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={tag.clear}
              // focus-visible ring added: these were invisible to keyboard use.
              className="inline-flex min-h-11 items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label={`Remove filter: ${tag.label}`}
            >
              {tag.label}
              <IconX className="size-4 opacity-70" />
            </button>
          ))}
          <Button
            type="button"
            size="touch"
            variant="ghost"
            disabled={nothingToClear}
            onClick={clearAll}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      {!needs ? (
        // A real card with a 44px action, not a sentence with a link in it.
        // This is the one thing that turns a list of every shelter in the
        // county into a list of the ones that can actually take you, so it
        // should not look like a footnote.
        <Card className="mt-4">
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
            <SheetTitle>
              Filters
              {activeCount > 0 ? (
                <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                  {activeCount} applied
                </span>
              ) : null}
            </SheetTitle>
            <SheetDescription>
              Changes apply as you pick. Close with X or tap outside.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FilterSection
              title="Location"
              description="Distances below are measured from here."
            >
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="touch"
                  variant={origin.label === "Near me" ? "default" : "outline"}
                  aria-pressed={origin.label === "Near me"}
                  onClick={useMyLocation}
                >
                  Near me
                </Button>
                {cities.map((city) => (
                  <Button
                    key={city}
                    type="button"
                    size="touch"
                    variant={origin.label === city ? "default" : "outline"}
                    aria-pressed={origin.label === city}
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
                  size="touch"
                  variant={
                    origin.label === defaultOrigin.label ? "default" : "outline"
                  }
                  aria-pressed={origin.label === defaultOrigin.label}
                  onClick={() => patch({ origin: defaultOrigin })}
                >
                  Downtown San Jose
                </Button>
              </div>
            </FilterSection>

            <FilterSection
              title="Distance"
              description="How far you are willing to travel."
            >
              <div className="flex flex-wrap gap-3">
                {distanceOptions.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    size="touch"
                    variant={
                      filters.miles === option.value ? "default" : "outline"
                    }
                    aria-pressed={filters.miles === option.value}
                    onClick={() => patch({ miles: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Type"
              description="Shelters, safe parking lots, or both."
            >
              <div className="flex flex-wrap gap-3">
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
                    size="touch"
                    variant={filters.kind === value ? "default" : "outline"}
                    aria-pressed={filters.kind === value}
                    onClick={() => patch({ kind: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <label className="mt-4 flex min-h-11 items-center justify-between gap-3 text-sm">
                <span>Hide lots that are full</span>
                <Switch
                  checked={filters.hideFull}
                  onCheckedChange={(checked) => patch({ hideFull: checked })}
                  aria-label="Hide lots that are full"
                />
              </label>
            </FilterSection>

            {needs ? (
              <FilterSection
                title="What fits you"
                description="Could work hides places a listed rule rules out. Confirmed fit shows only places that have published every rule you named."
              >
                <div className="flex flex-wrap gap-3">
                  {fitOptions.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="touch"
                      variant={filters.fit === value ? "default" : "outline"}
                      aria-pressed={filters.fit === value}
                      onClick={() => patch({ fit: value })}
                    >
                      {fitFilterLabel[value]}
                    </Button>
                  ))}
                </div>
              </FilterSection>
            ) : null}

            <FilterSection
              title="How you get in"
              description="What you do to get a bed: call, walk up, or ask through True Roof."
            >
              <div className="flex flex-wrap gap-3">
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
                    size="touch"
                    variant={filters.intake === value ? "default" : "outline"}
                    aria-pressed={filters.intake === value}
                    onClick={() =>
                      patch({ intake: value as PlaceFilters["intake"] })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="How fresh the info is"
              description="When someone last confirmed this. Not how you get in."
            >
              <div className="flex flex-wrap gap-3">
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
                    size="touch"
                    variant={
                      filters.freshness === value ? "default" : "outline"
                    }
                    aria-pressed={filters.freshness === value}
                    onClick={() =>
                      patch({ freshness: value as PlaceFilters["freshness"] })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </FilterSection>

            {!needs ? (
              <FilterSection
                title="What fits you"
                description="Answer ten quick questions and this list drops the places that cannot take you."
              >
                <Link
                  href="/get-started/find-a-place"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "touch" }),
                    "w-fit"
                  )}
                  onClick={() => setFiltersOpen(false)}
                >
                  Answer the questions
                </Link>
              </FilterSection>
            ) : null}
          </div>

          <SheetFooter className="border-t px-4 py-4 sm:flex-row">
            <Button
              type="button"
              size="touch"
              variant="outline"
              className="w-full shrink-0 sm:flex-1"
              disabled={nothingToClear}
              onClick={clearAll}
            >
              Clear all
            </Button>
            <Button
              type="button"
              size="touch"
              className="w-full shrink-0 sm:flex-1"
              onClick={() => setFiltersOpen(false)}
            >
              See {visible.length} {visible.length === 1 ? "place" : "places"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {visible.length === 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Nothing on this list can take you tonight</CardTitle>
            <CardDescription className="text-base">
              Call {here4You.name} at{" "}
              <a
                className="font-medium underline"
                href={`tel:${here4You.phone}`}
              >
                {here4You.display}
              </a>
              . They place people into shelter across the county and can look
              beyond this list. You can also open Filters and widen the
              distance.
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ listing, fit, rank }) => (
            <PlaceCard
              key={listing.id}
              listing={listing}
              fit={needs ? fit : undefined}
              miles={rank.miles}
              basis={rank.basis}
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
        <div className="mt-8 rounded-xl border p-4">
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

      {/* Primary action sits at the bottom on a phone, where a thumb reaches. */}
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
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  // A <section> with no accessible name is not exposed as a region, which left
  // the heading structurally orphaned for screen readers. The description is
  // tied in with aria-describedby so it is announced, not just seen: two
  // sections of this sheet both offer an option labelled "Call first", and the
  // description is what tells them apart.
  const headingId = React.useId()
  const descriptionId = React.useId()
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
      className="border-b py-5 first:pt-0 last:border-b-0"
    >
      <h3 id={headingId} className="text-sm font-medium">
        {title}
      </h3>
      {description ? (
        <p
          id={descriptionId}
          className="mt-1 mb-3 text-sm text-muted-foreground"
        >
          {description}
        </p>
      ) : (
        <div className="mb-3" />
      )}
      {children}
    </section>
  )
}
