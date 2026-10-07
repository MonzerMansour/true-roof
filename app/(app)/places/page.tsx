import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import { Reveal } from "@/components/marketing/reveal"
import { FirstVisitTour } from "@/components/app/first-visit-tour"
import { PlacesFeed } from "@/components/places/places-feed"
import { getPublishedListings } from "@/lib/listings/queries"
import { withReviewStats } from "@/lib/listings/reviews"
import { categoricalAgreement } from "@/lib/matching/categorical-score"
import { rankPublishedListings } from "@/lib/matching/rank"
import { hybridScore } from "@/lib/matching/score-blend"
import { photos } from "@/lib/photos"

// This page is personalized per signed-in user (their own saved answers,
// their own similarity scores), so it is not time-cached. A cached
// revalidate window here would keep serving stale match percentages after
// a listing's description changes and gets re-embedded, since the cached
// request key is based on the person's embedding, not the listing's.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Places",
  description:
    "Shelters and safe parking in one list. Hard rules remove what does not fit.",
}

export default async function PlacesPage() {
  const { listings, source } = await getPublishedListings()
  const ranked = await rankPublishedListings(listings)
  const withStats = await withReviewStats(ranked.listings)

  // Display-only breakdown per listing. The list order above is already
  // fixed by rankPublishedListings() using match_listings' cosine score
  // alone; this only adds the "why" a person can open on a card, it never
  // reorders anything.
  const matchDetails = Object.fromEntries(
    ranked.listings.flatMap((listing) => {
      const cosine = ranked.similarity.get(listing.id)
      if (!ranked.needs || cosine === undefined) return []

      const { score: categorical, factors } = categoricalAgreement(
        ranked.needs,
        listing
      )

      return [
        [
          listing.id,
          {
            cosine,
            categorical,
            factors,
            score: hybridScore(cosine, categorical),
          },
        ],
      ]
    })
  )

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <MarketingPhoto
          photo={photos.parking}
          priority
          sizes="100vw"
          className="absolute inset-0 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/88 to-background" />
        <Container className="relative pt-6 pb-12 sm:pt-8">
          <Reveal>
            <p className="text-sm font-medium text-primary">Places</p>
            <h1 className="mt-2 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              Shelters and safe parking, side by side
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Closest and most recently confirmed first. Tap Near me to use your
              location. Calling and directions need no account.
            </p>
            {source === "seed" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Showing sample sites because the listings table was not
                reachable.
              </p>
            ) : null}
          </Reveal>
        </Container>
      </section>

      <section className="border-t bg-primary/[0.03] py-10 sm:py-12">
        <Container>
          {/* First visit only, and never in the way: it sits above the list
              rather than over it, so the list stays usable with it on screen. */}
          <div className="mb-8">
            <FirstVisitTour />
          </div>

          <PlacesFeed
            listings={withStats}
            rankedBy={ranked.rankedBy}
            similarity={Object.fromEntries(ranked.similarity)}
            matchDetails={matchDetails}
          />
        </Container>
      </section>
    </>
  )
}
