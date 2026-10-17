import Link from "next/link"
import { IconKey, IconPlus } from "@tabler/icons-react"

import { PendingMembershipBanner } from "@/components/portal/pending-membership-banner"
import { PortalSiteCard } from "@/components/portal/portal-site-card"
import { buttonVariants } from "@/components/ui/button"
import { getPortalContext } from "@/lib/portal/queries"
import { cn } from "cn"

export default async function PortalHomePage() {
  const context = await getPortalContext()

  if (!context) return <OnboardingChoice />

  const { listings, sharedListings } = context
  const nothingYet = listings.length === 0 && sharedListings.length === 0

  // Somebody can hold a site code without belonging to any organization, so
  // having no membership is only the empty state when they have no sites
  // either.
  if (!context.primaryMembership && nothingYet) return <OnboardingChoice />

  if (context.primaryMembership?.status === "pending" && nothingYet) {
    return (
      <div className="w-full">
        <PendingMembershipBanner
          orgName={context.organization?.name ?? "the organization"}
        />
      </div>
    )
  }

  const heading = context.organization?.name ?? "Your sites"

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{heading}</h1>
        <p className="mt-1 text-muted-foreground">
          This is how each site looks to someone searching for a place to
          sleep. Only published sites are on that list.
        </p>
      </div>

      {listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <PortalSiteCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No sites of your own yet.
        </p>
      )}

      {sharedListings.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Shared with you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run by another organization. You can keep their details current.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {sharedListings.map((listing) => (
              <PortalSiteCard key={listing.id} listing={listing} shared />
            ))}
          </div>
        </section>
      ) : null}

      {/* One row, at the end, rather than a card per option competing with
          the sites themselves. */}
      <div className="flex flex-wrap gap-2 border-t pt-6">
        {context.canManage ? (
          <Link
            href="/portal/sites/new"
            className={cn(buttonVariants({ variant: "outline", size: "touch" }))}
          >
            <IconPlus />
            Add a site
          </Link>
        ) : null}
        <Link
          href="/portal/join"
          className={cn(buttonVariants({ variant: "ghost", size: "touch" }))}
        >
          <IconKey />
          Add a site with a code
        </Link>
      </div>
    </div>
  )
}

function OnboardingChoice() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Set up your site
        </h1>
        <p className="mt-1 text-muted-foreground">
          Two ways in, depending on whether the site is already on True Roof.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/portal/create"
          className={cn(buttonVariants({ size: "touch" }), "w-fit")}
        >
          <IconPlus />
          Add a shelter or lot nobody has listed
        </Link>
        <Link
          href="/portal/join"
          className={cn(buttonVariants({ variant: "outline", size: "touch" }), "w-fit")}
        >
          <IconKey />
          I was given a site code
        </Link>
      </div>
    </div>
  )
}
