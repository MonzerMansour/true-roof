import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { Container } from "@/components/marketing/container"
import { FindAPlaceForm } from "@/components/matching/find-a-place-form"
import { getAppSession } from "@/lib/auth/session"
import { FIND_A_PLACE_PATH } from "@/lib/matching/paths"

export const metadata: Metadata = {
  title: "Find a place",
  description:
    "A few short questions so True Roof can show shelters and safe parking that fit you.",
}

// Account only, and a guest cookie is not enough.
//
// What these answers unlock needs a real auth.uid(): the match percentage and
// the order of the feed both come from an embedding stored in public.seeker_needs,
// whose RLS policies are scoped to the signed-in user. A guest has no row there,
// so answering the questions as a guest would produce no match score at all.
//
// Browsing is deliberately not gated. A signed-out person still gets the whole
// list, the distance sort and every filter on /places; they are sent there
// rather than to a dead end.
export default async function FindAPlacePage() {
  const session = await getAppSession()

  if (!session) {
    redirect(`/places?signin=1&next=${encodeURIComponent(FIND_A_PLACE_PATH)}`)
  }

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">
        Looking for shelter tonight
      </p>
      <h1 className="mt-2 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        A few questions, so we only show places that fit
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        About a minute. Your answers are saved on this phone and to your
        account, so they follow you to another phone.
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
