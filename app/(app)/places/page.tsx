import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { PlacesFeed } from "@/components/places/places-feed"
import { getPublishedListings } from "@/lib/listings/queries"
import { rankPublishedListings } from "@/lib/matching/rank"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Places",
  description:
    "Shelters and safe parking in one list. Hard rules remove what does not fit.",
}

export default async function PlacesPage() {
  const { listings, source } = await getPublishedListings()
  const ranked = await rankPublishedListings(listings)

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Places</p>
      <h1 className="mt-2 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Shelters and safe parking, side by side
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Closest and most recently confirmed first. Tap Near me to use your
        location. Calling and directions need no account.
      </p>
      {source === "seed" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Showing sample sites because the listings table was not reachable.
        </p>
      ) : null}

      <div className="mt-8">
        <PlacesFeed listings={ranked.listings} rankedBy={ranked.rankedBy} />
      </div>
    </Container>
  )
}
