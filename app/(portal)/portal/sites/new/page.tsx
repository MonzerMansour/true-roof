import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { CreateSiteForm } from "@/components/portal/create-site-form"
import { getPortalContext } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Add a site",
}

export default async function AddSitePage() {
  const context = await getPortalContext()

  // No organization yet: the first site comes with creating one.
  if (!context?.organization) redirect("/portal/create")
  if (!context.canManage) redirect("/portal")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Add a site</h1>
        <p className="mt-1 text-muted-foreground">
          Another physical address run by {context.organization.name}. Each site
          has its own rules, beds, and publish switch.
        </p>
      </div>
      <CreateSiteForm mode="add-site" />
    </div>
  )
}
