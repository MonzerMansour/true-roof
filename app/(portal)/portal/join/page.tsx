import type { Metadata } from "next"
import Link from "next/link"

import { JoinOrgForm } from "@/components/portal/join-org-form"
import { PendingMembershipBanner } from "@/components/portal/pending-membership-banner"
import { buttonVariants } from "@/components/ui/button"
import { getPortalContext } from "@/lib/portal/queries"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Join with a code",
}

export default async function JoinPage() {
  const context = await getPortalContext()
  const membership = context?.primaryMembership

  if (membership?.status === "pending") {
    return (
      <div className="max-w-2xl">
        <PendingMembershipBanner
          orgName={context?.organization?.name ?? "the organization"}
        />
      </div>
    )
  }

  if (membership?.status === "active") {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            You already belong to a site
          </h1>
          <p className="mt-1 text-muted-foreground">
            You are active at {context?.organization?.name ?? "your organization"}.
          </p>
        </div>
        <Link href="/portal" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
          Back to portal home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Join with an access code
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter the code your site director gave you. They accept the request
          before you can edit the listing.
        </p>
      </div>
      <JoinOrgForm />
    </div>
  )
}
