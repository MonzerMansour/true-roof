import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Quiet mode",
  description: "Fewer reminders after steady months.",
}

export default function QuietStubPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Financials</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Quiet mode
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Not built yet. When it is live, about six months of on-time rent and no
        missed deadlines will step reminders back to renewals only. Any warning
        sign turns full monitoring back on. Not forever nagging.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/financials" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Financials
        </Link>
      </div>
    </Container>
  )
}
