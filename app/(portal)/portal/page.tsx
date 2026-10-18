import Link from "next/link"
import { IconArrowRight, IconKey, IconPlus } from "@tabler/icons-react"

import { PendingMembershipBanner } from "@/components/portal/pending-membership-banner"
import { PortalSiteCard } from "@/components/portal/portal-site-card"
import { buttonVariants } from "@/components/ui/button"
import { getInterestCounts } from "@/lib/listings/interest"
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

  // Across every site at once. Requests used to live only inside a tab on
  // one site's page, so the only way to find out somebody was waiting was to
  // open each site and look. Waiting for a bed is the most time-sensitive
  // thing in this app, so it goes at the top rather than two clicks in.
  const all = [...listings, ...sharedListings]
  const waiting = await getInterestCounts(all.map((listing) => listing.id))
  const needsYou = all
    .map((listing) => ({ listing, count: waiting.get(listing.id) ?? 0 }))
    .filter((row) => row.count > 0)

  const heading = context.organization?.name ?? "Your sites"

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Adding a site is the reason somebody opens this page without
          already having one, so it sits with the title rather than below
          however many sites they already run, and stays put while they
          scroll. The sentence underneath is read once and is not worth the
          screen: pinned with it, this block took 23% of a phone. */}
      <div className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:-mx-6 md:px-6">
        <h1 className="font-heading text-2xl font-semibold">{heading}</h1>
        <div className="flex shrink-0 flex-wrap gap-2">
          {context.canManage ? (
            <Link
              href="/portal/sites/new"
              className={cn(buttonVariants({ size: "touch" }))}
            >
              <IconPlus />
              Add a site
            </Link>
          ) : null}
          <Link
            href="/portal/join"
            className={cn(buttonVariants({ variant: "outline", size: "touch" }))}
          >
            <IconKey />
            Use a code
          </Link>
        </div>
      </div>

      <p className="-mt-4 text-muted-foreground">
        This is how each site looks to someone searching for a place to sleep.
        Only published sites are on that list.
      </p>

      {needsYou.length > 0 ? (
        <section
          className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4"
          aria-labelledby="needs-you"
        >
          <h2 id="needs-you" className="font-heading text-lg font-semibold">
            Someone is waiting
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {needsYou.map(({ listing, count }) => (
              <li key={listing.id}>
                <Link
                  href={`/portal/sites/${listing.id}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium hover:underline"
                >
                  {count} {count === 1 ? "person has" : "people have"} asked
                  about {listing.name}
                  <IconArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
