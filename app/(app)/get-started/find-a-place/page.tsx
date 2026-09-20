import type { Metadata } from "next"

import { NeedsSignIn } from "@/components/dashboard/needs-sign-in"
import { Container } from "@/components/marketing/container"
import { FindAPlaceForm } from "@/components/matching/find-a-place-form"
import { hasSeekerAccess } from "@/lib/guest-server"

export const metadata: Metadata = {
  title: "Find a place",
  description:
    "A few short questions so True Roof can show shelters and safe parking that fit you.",
}

export default async function FindAPlacePage() {
  const user = await hasSeekerAccess()

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-sm font-medium text-primary">Looking for shelter tonight</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        A few questions, so we only show places that fit
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        About a minute. Answers are saved on this phone. If you have an account, a copy also helps match you to places.
      </p>

      <p className="mt-4 max-w-xl rounded-lg border p-3 text-sm">
        In danger right now? Call <a className="font-medium underline" href="tel:911">911</a>.
        Domestic violence:{" "}
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
        {user ? (
          <FindAPlaceForm />
        ) : (
          <NeedsSignIn
            title="Create an account or sign in"
            description="You need an account to answer these questions and see places that fit."
          />
        )}
      </div>
    </Container>
  )
}
