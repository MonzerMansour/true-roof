import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { GuidedTour } from "@/components/app/guided-tour"
import { PortalShell } from "@/components/portal/portal-shell"
import { getPortalContext } from "@/lib/portal/queries"

export default async function PortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const context = await getPortalContext()

  if (!context) {
    redirect("/for-providers?signin=1")
  }

  // The guided tour still walks the organization's first site, whether or not
  // it is a draft. The tab is different: it exists only to finish a draft.
  const primaryListingId = context.listings[0]?.id ?? null
  const draftListingId =
    context.listings.find((listing) => !listing.published)?.id ?? null

  return (
    <PortalShell draftListingId={draftListingId}>
      {children}
      {/* The layout already has everything the provider steps depend on, so
          the tour is told rather than querying for it again. */}
      <GuidedTour
        tour="provider"
        audience={{
          signedIn: true,
          isDirector: context.isDirector,
          hasOrganization: Boolean(context.organization),
          primaryListingId: primaryListingId,
        }}
      />
    </PortalShell>
  )
}
