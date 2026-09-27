import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Container } from "@/components/marketing/container"
import { PlaceDetail } from "@/components/places/place-detail"
import { getListingById, getPublishedListings } from "@/lib/listings/queries"

export const revalidate = 60

type Params = Promise<{ id: string }>

export async function generateStaticParams() {
  const { listings } = await getPublishedListings()
  return listings.map((listing) => ({ id: listing.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { id } = await params
  const result = await getListingById(id)

  if (!result) {
    return { title: "Place" }
  }

  return {
    title: result.listing.name,
    description: `${result.listing.orgName} in ${result.listing.city}.`,
  }
}

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<{ intent?: string }>
}) {
  const { id } = await params
  const { intent } = await searchParams
  const result = await getListingById(id)

  if (!result) {
    notFound()
  }

  return (
    <Container className="py-8 sm:py-10">
      <PlaceDetail listing={result.listing} intent={intent ?? null} />
    </Container>
  )
}
