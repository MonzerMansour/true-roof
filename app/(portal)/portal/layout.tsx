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

  const primaryListingId = context.listings[0]?.id ?? null

  return (
    <PortalShell
      primaryListingId={primaryListingId}
      showAccess={context.isDirector}
    >
      {children}
      {/* The layout already has everything the provider steps depend on, so
          the tour is told rather than querying for it again. */}
      <GuidedTour
        role="provider"
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
