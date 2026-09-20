import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccessCodeCard } from "@/components/portal/access-code-card"
import { PendingRequests } from "@/components/portal/pending-requests"
import { fetchAccessCode } from "@/lib/portal/actions"
import { getPortalContext } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Access and approvals",
}

export default async function AccessPage() {
  const context = await getPortalContext()

  if (!context?.isDirector || !context.organization) {
    redirect("/portal")
  }

  const code = await fetchAccessCode(context.organization.id)

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Access and approvals
        </h1>
        <p className="mt-1 text-muted-foreground">
          Share the code with your staff. Approve each person before they can
          edit the site.
        </p>
      </div>

      {code ? (
        <AccessCodeCard orgId={context.organization.id} initialCode={code} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Could not load the access code. Refresh the page to try again.
        </p>
      )}

      <PendingRequests requests={context.pendingForDirector} />
    </div>
  )
}
