import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { LocalOnlyNotice } from "@/components/dashboard/local-only-notice"

export const metadata: Metadata = {
  title: "Financials",
  description: "Rent, bills, recerts, and warnings you can act on.",
}

// No account needed. The old gate said "Your rent, bills, and recerts are tied
// to your account", which was not true: they live in localStorage and no server
// ever sees them.
export default function FinancialsPage() {
  return (
    <div className="bg-primary/[0.02]">
      <Container className="py-8 sm:py-10">
        <p className="text-sm font-medium text-primary">After you get housed</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Financials
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Rent, bills, and the renewal dates that are easy to miss.
        </p>

        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          <LocalOnlyNotice />{" "}
          Crisis:{" "}
          <a className="font-medium underline" href="tel:911">
            911
          </a>
          ,{" "}
          <a className="font-medium underline" href="tel:988">
            988
          </a>
          , DV{" "}
          <a className="font-medium underline" href="tel:+18007997233">
            1-800-799-7233
          </a>
          .
        </p>

        <div className="mt-8 grid gap-8">
          <DashboardClient />
        </div>
      </Container>
    </div>
  )
}
