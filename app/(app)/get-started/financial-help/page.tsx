import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { FinancialHelpForm } from "@/components/dashboard/financial-help-form"
import { NeedsSignIn } from "@/components/dashboard/needs-sign-in"
import { hasSeekerAccess } from "@/lib/guest-server"

export const metadata: Metadata = {
  title: "Set up your plan",
  description:
    "A few facts about your rent, programs, and bills. True Roof writes the rest.",
}

export default async function FinancialHelpPage() {
  const user = await hasSeekerAccess()

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-sm font-medium text-primary">After you get housed</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        A few questions, and True Roof writes the year
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        About two minutes. Your answers set up your deadlines, reminders, and
        rent cushion, and are saved on this phone.
      </p>

      <div className="mt-8">
        {user ? <FinancialHelpForm /> : <NeedsSignIn />}
      </div>
    </Container>
  )
}
