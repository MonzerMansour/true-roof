import type { Metadata } from "next"

import { ListingSettingsForm } from "@/components/portal/listing-settings-form"
import { getListingForPortal } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Site settings",
}

export default async function SiteSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { listing, organization, canManage } = await getListingForPortal(id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Site settings</h1>
        <p className="mt-1 text-muted-foreground">
          Update what seekers see. Enums only. Confirming keeps the freshness
          badge honest.
        </p>
      </div>
      <ListingSettingsForm
        listing={listing}
        organization={organization}
        canManage={canManage}
      />
    </div>
  )
}
