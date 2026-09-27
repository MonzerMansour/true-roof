import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SeekerDashboard } from "@/components/app/seeker-dashboard"
import { Container } from "@/components/marketing/container"
import { getAppSession, homePathForRole } from "@/lib/auth/session"
import { getPublishedListings } from "@/lib/listings/queries"

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your asks, saved places, recent visits, and upcoming deadlines.",
}

export default async function SeekerHomePage() {
  const session = await getAppSession()

  if (session?.role === "provider") {
    redirect(homePathForRole("provider"))
  }

  const { listings } = await getPublishedListings()

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <SeekerDashboard listings={listings} />
    </Container>
  )
}
