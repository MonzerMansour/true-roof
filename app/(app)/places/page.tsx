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
        <PlacesFeed listings={ranked.listings} rankedBy={ranked.rankedBy} />
      </div>
    </Container>
  )
}
