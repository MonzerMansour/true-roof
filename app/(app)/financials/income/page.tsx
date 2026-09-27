import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Will this job hurt me?",
  description: "Estimate how a wage change affects rent and benefits.",
}

export default function IncomeStubPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Financials</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Will this job hurt me?
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Not built yet. When it is live, you will enter a possible wage and see
        estimated changes to rent share, CalFresh, and Medi-Cal. Always labeled
        as estimates. Never tells you to take or refuse a job.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/financials" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Financials
        </Link>
      </div>
    </Container>
  )
}
