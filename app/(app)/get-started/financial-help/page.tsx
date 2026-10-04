import type { Metadata } from "next"

import { Container } from "@/components/marketing/container"
import { FinancialHelpForm } from "@/components/dashboard/financial-help-form"
import { LocalOnlyNotice } from "@/components/dashboard/local-only-notice"

export const metadata: Metadata = {
  title: "Set up your plan",
  description:
    "A few facts about your rent, programs, and bills. True Roof writes the rest.",
}

// No account needed. Everything this form collects is written to localStorage
// by lib/obligations/storage.ts and never sent anywhere: there is no table for
// it, no API route, and no network call in the flow. The old sign-in wall
// protected nothing and blocked someone from writing down their own rent.
export default function FinancialHelpPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">After you get housed</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        A few questions, and True Roof writes the year
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        About two minutes. Your answers set up your deadlines, reminders, and
        rent cushion, and are saved on this phone.
      </p>

      <LocalOnlyNotice className="mt-4 max-w-xl rounded-lg border p-3 text-sm" />

      <div className="mt-8">
        <FinancialHelpForm />
      </div>
    </Container>
  )
}
