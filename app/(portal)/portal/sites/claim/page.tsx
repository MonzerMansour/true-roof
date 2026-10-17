import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ClaimSiteForm } from "@/components/portal/claim-site-form"
import { buttonVariants } from "@/components/ui/button"
import { getPortalContext } from "@/lib/portal/queries"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Add a site with a code",
}

export default async function ClaimSitePage() {
  const context = await getPortalContext()

  if (!context) redirect("/for-providers?signin=1")

  // A site has to land somewhere, and only a director or manager can be the
  // one to take it on their organization's behalf.
  if (!context.organization || !context.canManage) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Add a site with a code
          </h1>
          <p className="mt-1 text-muted-foreground">
            A transferred site joins an organization, so you need one first,
            and you need to be a director or manager of it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/portal/create" className={cn(buttonVariants())}>
            Create an organization
          </Link>
          <Link
            href="/portal/join"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Join one with a code
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Add a site with a code
        </h1>
        <p className="mt-1 text-muted-foreground">
          For a site that already exists on True Roof and is moving to{" "}
          {context.organization.name}. Its director gives you a transfer code.
          To add a site nobody has listed yet,{" "}
          <Link href="/portal/sites/new" className="font-medium underline">
            start a new one
          </Link>
          .
        </p>
      </div>
      <ClaimSiteForm />
    </div>
  )
}
