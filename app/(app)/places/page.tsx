import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { PlacesFeed } from "@/components/places/places-feed"
import { getPublishedListings } from "@/lib/listings/queries"
import { categoricalAgreement } from "@/lib/matching/categorical-score"
import { rankPublishedListings } from "@/lib/matching/rank"
import { hybridScore } from "@/lib/matching/score-blend"

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
          { cosine, categorical, factors, score: hybridScore(cosine, categorical) },
        ],
      ]
    })
  )

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Places</p>
      <h1 className="font-heading mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Shelters and safe parking, side by side
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Near me sorts by distance. Filter by how far, how you get in, or how
        fresh the status is. Save a site to your dashboard. Call opens the
        phone. Waitlist and ask for a bed need an account.
      </p>
      {source === "seed" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Showing sample sites because the listings table was not reachable.
        </p>
      ) : null}

      <div className="mt-8">
        <PlacesFeed
          listings={ranked.listings}
          rankedBy={ranked.rankedBy}
          similarity={Object.fromEntries(ranked.similarity)}
          matchDetails={matchDetails}
        />
      </div>
    </Container>
  )
}
