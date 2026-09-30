import type { Metadata } from "next"
import { Suspense } from "react"

import { Container } from "@/components/marketing/container"
import { FindAPlaceForm } from "@/components/matching/find-a-place-form"

export const metadata: Metadata = {
  title: "Find a place",
  description:
    "A few short questions so True Roof can show shelters and safe parking that fit you.",
}

// No account needed, and no guest cookie needed either.
//
// These ten answers are written to localStorage and never leave the phone
// unless the person is signed in, in which case a copy is embedded for ranking.
// Requiring an account to answer them contradicted the page's own promise that
// answers stay on this device, and it put a login wall in front of somebody
// trying to find a bed tonight.
export default function FindAPlacePage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">
        Looking for shelter tonight
      </p>
      <h1 className="mt-2 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        A few questions, so we only show places that fit
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        About a minute, and no account needed. Answers stay on this phone. Sign
        in later if you want them on another device.
      </p>

      <p className="mt-4 max-w-xl rounded-lg border p-3 text-sm">
        In danger right now? Call{" "}
        <a className="font-medium underline" href="tel:911">
          911
        </a>
        . Domestic violence:{" "}
        <a className="font-medium underline" href="tel:+18007997233">
          1-800-799-7233
        </a>
        . Crisis or thoughts of suicide:{" "}
        <a className="font-medium underline" href="tel:988">
          988
        </a>
        . These skip everything below and do not need an account.
      </p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <FindAPlaceForm />
        </Suspense>
      </div>
    </Container>
  )
}
