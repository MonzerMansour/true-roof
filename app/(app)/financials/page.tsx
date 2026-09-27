import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { NeedsSignIn } from "@/components/dashboard/needs-sign-in"
import { FinancialStubs } from "@/components/dashboard/financial-stubs"
import { hasSeekerAccess } from "@/lib/guest-server"

export const metadata: Metadata = {
  title: "Financials",
  description: "Rent, bills, recerts, and warnings you can act on.",
}

export default async function FinancialsPage() {
  const user = await hasSeekerAccess()

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">After you get housed</p>
      <h1 className="font-heading mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Financials
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Rent, bills, and program deadlines. This is not another place search.
      </p>

      <div className="mt-8 grid gap-8">
        {user ? (
          <DashboardClient />
        ) : (
          <NeedsSignIn
            title="Sign in to see Financials"
            description="Your rent, bills, and recerts are tied to your account."
          />
        )}
        <FinancialStubs />
      </div>
    </Container>
  )
}
