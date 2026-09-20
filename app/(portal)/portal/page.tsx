import Link from "next/link"
import { IconArrowRight, IconKey, IconPlus, IconSettings } from "@tabler/icons-react"

import { PendingMembershipBanner } from "@/components/portal/pending-membership-banner"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPortalContext } from "@/lib/portal/queries"
import { cn } from "cn"

export default async function PortalHomePage() {
  const context = await getPortalContext()

  if (!context || !context.primaryMembership) {
    return <OnboardingChoice />
  }

  if (context.primaryMembership.status === "pending") {
    return (
      <div className="max-w-2xl">
        <PendingMembershipBanner
          orgName={context.organization?.name ?? "the organization"}
        />
      </div>
    )
  }

  const listings = context.listings

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {context.organization?.name ?? "Your organization"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Keep each site current. Seekers only see published rows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardHeader>
              <CardTitle>{listing.name}</CardTitle>
              <CardDescription>
                {listing.city}. {listing.published ? "Published" : "Draft"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={`/portal/sites/${listing.id}/settings`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <IconSettings />
                Edit site details
              </Link>
            </CardContent>
          </Card>
        ))}

        {listings.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No sites yet</CardTitle>
              <CardDescription>
                Add the first physical address for this organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/portal/create"
                className={cn(buttonVariants())}
              >
                <IconPlus />
                Create a site
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {context.isDirector ? (
        <Card>
          <CardHeader>
            <CardTitle>Access and approvals</CardTitle>
            <CardDescription>
              Share your access code and approve staff who ask to join.
              {context.pendingForDirector.length > 0
                ? ` ${context.pendingForDirector.length} request${context.pendingForDirector.length === 1 ? "" : "s"} waiting.`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/portal/access"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <IconKey />
              Open access page
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function OnboardingChoice() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Set up your site
        </h1>
        <p className="mt-1 text-muted-foreground">
          Start a new organization, or join one that already has an access code.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Create a site
            </p>
            <CardTitle>Run a new shelter or lot</CardTitle>
            <CardDescription className="text-base">
              Make an organization and its first site. You become the director,
              so you can publish it and approve staff later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portal/create" className={cn(buttonVariants())}>
              <IconPlus />
              Create a site
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Join with a code
            </p>
            <CardTitle>Work at an existing site</CardTitle>
            <CardDescription className="text-base">
              Enter the access code from your site director. They accept your
              request before you can edit the listing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/portal/join"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <IconArrowRight />
              Enter access code
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
