import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { NeedsSignIn } from "@/components/dashboard/needs-sign-in"
import { hasSeekerAccess } from "@/lib/guest-server"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Rent, bills, recerts, and warnings you can act on.",
}

export default async function DashboardPage() {
  const user = await hasSeekerAccess()

  return (
    <Container className="py-16">
      <p className="text-sm font-medium text-primary">After you get housed</p>
      <h1 className="font-heading mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Dashboard
      </h1>

      <div className="mt-10">
        {user ? (
          <DashboardClient />
        ) : (
          <NeedsSignIn
            title="Sign in to see your dashboard"
            description="Your rent, bills, and recerts are tied to your account."
          />
        )}
      </div>
    </Container>
  )
}
