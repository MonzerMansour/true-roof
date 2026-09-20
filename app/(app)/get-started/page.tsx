import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { NeedsSignIn } from "@/components/dashboard/needs-sign-in"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "What do you need",
  description: "Looking for shelter tonight, or help staying housed?",
}

export default async function GetStartedPage() {
  const client = await createServerSupabaseClient()
  const user = client ? (await client.auth.getUser()).data.user : null

  return (
    <Container className="py-16">
      <p className="text-sm font-medium text-primary">Welcome</p>
      <h1 className="font-heading mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        What do you need right now?
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Pick one. You can always find the other from the menu later.
      </p>

      <div className="mt-10">
        {user ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/features/matcher">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>Looking for shelter tonight</CardTitle>
                  <CardDescription className="text-base">
                    Find a shelter bed or a safe place to park. This part of
                    True Roof is still being built — this link goes to the
                    feature overview for now.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/get-started/financial-help">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>Looking for financial help</CardTitle>
                  <CardDescription className="text-base">
                    You already have a place. Set up your rent, bills, and
                    program deadlines so nothing slips.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        ) : (
          <NeedsSignIn
            title="Sign in to continue"
            description="Tell True Roof what you need once you are signed in."
          />
        )}
      </div>
    </Container>
  )
}
