import type { Metadata } from "next"

import { CreateSiteForm } from "@/components/portal/create-site-form"

export const metadata: Metadata = {
  title: "Create a site",
}

export default function CreateSitePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Create a site</h1>
        <p className="mt-1 text-muted-foreground">
          One organization can hold more than one site. Start with the first
          physical address.
        </p>
      </div>
      <CreateSiteForm />
    </div>
  )
}
