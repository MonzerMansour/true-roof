import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Get Help",
  description: "Reach a person when rent or a recert is at risk.",
}

export default function GetHelpStubPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Financials</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Get Help
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Not built yet. When it is live, a warning you can act on will offer one
        tap to a caseworker path or a local resource. Crisis, domestic violence,
        and 988 stay a separate human path and skip the data bundle.
      </p>
      <div className="mt-6 space-y-2 text-sm">
        <p>
          Right now:{" "}
          <a className="font-medium underline" href="tel:911">
            911
          </a>
          ,{" "}
          <a className="font-medium underline" href="tel:988">
            988
          </a>
          , or{" "}
          <a className="font-medium underline" href="tel:+18007997233">
            1-800-799-7233
          </a>
          .
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/financials" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Financials
        </Link>
      </div>
    </Container>
  )
}
