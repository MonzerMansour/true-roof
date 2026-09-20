import type { ReactNode } from "react"
import { redirect } from "next/navigation"

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
    </PortalShell>
  )
}
