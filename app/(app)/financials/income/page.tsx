import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { IncomeCheckForm } from "@/components/dashboard/income-check-form"
import { NeedsSignIn } from "@/components/dashboard/needs-sign-in"
import { buttonVariants } from "@/components/ui/button"
import { hasSeekerAccess } from "@/lib/guest-server"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Will this job hurt me?",
  description: "Estimate how a wage change affects rent and benefits.",
}

export default async function IncomePage() {
  const user = await hasSeekerAccess()

  return (
    <Container className="py-8 sm:py-10">
      <Link
        href="/financials"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mb-4")}
      >
        Back to Financials
      </Link>
      <p className="text-sm font-medium text-primary">Financials</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Will this job hurt me?
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A raise can cost you Medi-Cal. A gig week can look like too much
        income. See the before and after before you say yes.
      </p>

      <div className="mt-8">
        {user ? (
          <IncomeCheckForm />
        ) : (
          <NeedsSignIn
            title="Sign in to check your numbers"
            description="Your programs and income are tied to your account."
          />
        )}
      </div>
    </Container>
  )
}
