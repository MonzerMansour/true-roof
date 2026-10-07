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
          Rent, bills, and program deadlines. This is not another place search.
        </p>

        <LocalOnlyNotice className="mt-4 max-w-2xl rounded-xl border bg-card p-3 text-sm ring-1 ring-primary/10" />

        {/* The "Coming next" grid of unbuilt features was removed. Three of
            its four tiles linked to pages that say "Not built yet", which is a
            roadmap, not something a person can act on. The stub pages still
            exist under /financials/* for whoever builds them. */}
        <div className="mt-8 grid gap-8">
          <DashboardClient />
        </div>
      </Container>
    </div>
  )
}
