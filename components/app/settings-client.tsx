"use client"

import * as React from "react"
import Link from "next/link"

import { DisplaySettings } from "@/components/app/display-settings"
import { NeedsSummary } from "@/components/matching/needs-summary"
import { MyPlaceRequests } from "@/components/places/my-place-requests"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { useSession } from "@/components/auth/session-provider"
import { setDeveloperMode, useDeveloperMode } from "@/lib/dev-mode"
import { clearNeeds, loadNeeds } from "@/lib/matching/storage"
import { clearAllData, loadProfile } from "@/lib/obligations/storage"
import type { SeekerNeeds } from "@/lib/matching/needs"
import type { ObligationsProfile } from "@/lib/obligations/types"
import { toast } from "sonner"

export function SettingsClient() {
  const { session, signOut } = useSession()
  const [needs, setNeeds] = React.useState<SeekerNeeds | null>(null)
  const [plan, setPlan] = React.useState<ObligationsProfile | null>(null)
  const [ready, setReady] = React.useState(false)
  const developerMode = useDeveloperMode()

  React.useEffect(() => {
    setNeeds(loadNeeds())
    setPlan(loadProfile())
    setReady(true)
  }, [])

  function handleClearNeeds() {
    clearNeeds()
    setNeeds(null)
    toast.success("Your place answers were deleted from this device.")
  }

  function handleClearPlan() {
    clearAllData()
    setPlan(null)
    toast.success("Your housing plan was deleted from this device.")
  }

  if (!ready) return null

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Change what you told us, make the text bigger, or delete everything
          off this phone.
        </p>
      </div>

      {/* First, not last: for someone who cannot read the page comfortably,
          nothing below this matters until it is set. */}
      <DisplaySettings />

      <Card>
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
          <CardDescription>
            {session?.email ?? "This session has no email on file."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are using this phone as a guest.
            </p>
          )}
        </CardContent>
      </Card>

      <MyPlaceRequests />

      <Card>
        <CardHeader>
          <CardTitle>Place answers</CardTitle>
          <CardDescription>
            Pets, vehicle, ID, and check-in times. Change them here, not on the
            places list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needs ? (
            <NeedsSummary needs={needs} onClear={handleClearNeeds} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                You have not answered the place questions yet.
              </p>
              <Link
                href="/get-started/find-a-place"
                className={buttonVariants({ variant: "outline" })}
              >
                Answer a few questions
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>After you get housed</CardTitle>
          <CardDescription>
            Rent, programs, and who to call about your lease.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {plan ? (
            <>
              <p>Move-in date: {plan.moveInDate || "Not set"}</p>
              <p>
                Rent: ${plan.rentAmount.toLocaleString()} due on day{" "}
                {plan.rentDueDay}
              </p>
              <p>
                Programs:{" "}
                {plan.programs.length > 0
                  ? plan.programs.map((item) => item.label).join(", ")
                  : "None yet"}
              </p>
              <p>
                Case manager:{" "}
                {plan.caseManagerName || plan.caseManagerContact
                  ? `${plan.caseManagerName} ${plan.caseManagerContact}`.trim()
                  : "Not set"}
              </p>
              <Link
                href="/get-started/financial-help"
                className={buttonVariants({ variant: "outline" })}
              >
                Edit my plan
              </Link>
              <Button variant="destructive" onClick={handleClearPlan}>
                Delete my plan
              </Button>
            </>
          ) : (
            <Link
              href="/get-started/financial-help"
              className={buttonVariants({ variant: "outline" })}
            >
              Set up my plan
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer mode</CardTitle>
          <CardDescription>
            For the team testing matches. Most people can leave this off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="developer-mode" id="developer-mode-label">
                Show match analytics
              </FieldLabel>
              <FieldDescription>
                On Places, open a match to see the raw cosine score and how
                closely each of your phrases lines up with the site&apos;s. It
                never changes the order of the list. Saved on this device only.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="developer-mode"
              aria-labelledby="developer-mode-label"
              checked={developerMode}
              onCheckedChange={(checked) => {
                setDeveloperMode(checked)
                toast.success(
                  checked ? "Developer mode on." : "Developer mode off."
                )
              }}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
