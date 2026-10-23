import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { IconPencil } from "@tabler/icons-react"

import { CreateSiteForm } from "@/components/portal/create-site-form"
import { buttonVariants } from "@/components/ui/button"
import { getPortalContext } from "@/lib/portal/queries"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Add a site",
}

export default async function AddSitePage() {
  const context = await getPortalContext()

  // No organization yet: the first site comes with creating one.
  if (!context?.organization) redirect("/portal/create")
  if (!context.canManage) redirect("/portal")

  // One site in progress at a time. The server refuses a second draft too, so
  // this is the explanation rather than the only guard.
  const draft = context.listings.find((listing) => !listing.published)

  if (draft) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Finish your draft first
          </h1>
          <p className="mt-1 max-w-xl text-muted-foreground">
            {draft.name} is a draft that is not on the Places list yet. Only
            one site can be in progress at a time, so publish it before adding
            another.
          </p>
        </div>
        <div>
          <Link
            href={`/portal/sites/${draft.id}/settings`}
            className={cn(buttonVariants({ size: "touch" }))}
          >
            <IconPencil />
            Continue {draft.name}
          </Link>
        </div>
      </div>
    )
  }

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
