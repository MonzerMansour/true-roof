import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PendingRequests } from "@/components/portal/pending-requests"
import { ShareSiteCard } from "@/components/portal/share-site-card"
import { fetchListingAccessCode } from "@/lib/portal/actions"
import { getPortalContext } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Share your sites",
}

// This page used to hand out one code for the whole organization, which let
// whoever had it edit every site it ran. Codes belong to sites now, so this
// lists them: one per site, each giving access to that site and nothing else.
export default async function AccessPage() {
  const context = await getPortalContext()

  if (!context?.isDirector) redirect("/portal")

  const sites = await Promise.all(
    context.listings.map(async (listing) => ({
      listing,
      code: await fetchListingAccessCode(listing.id),
    }))
  )

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Share your sites
        </h1>
        <p className="mt-1 text-muted-foreground">
          Each site has its own code. Give one to someone helping with that
          site and they can keep its details current. They see only that site,
          and it stays yours.
        </p>
      </div>

      {sites.length === 0 ? (
        <p className="text-muted-foreground">
          No sites yet.{" "}
          <Link href="/portal/sites/new" className="font-medium underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sites.map(({ listing, code }) => (
            <ShareSiteCard
              key={listing.id}
              listingId={listing.id}
              listingName={listing.name}
              initialCode={code}
              canRotate
            />
          ))}
        </div>
      )}

      {/* Requests made under the old organization-wide code, which can still
          be waiting. Nothing creates new ones. */}
      {context.pendingForDirector.length > 0 ? (
        <PendingRequests requests={context.pendingForDirector} />
      ) : null}
    </div>
  )
}
