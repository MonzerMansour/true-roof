import type { Metadata } from "next"
import Link from "next/link"

import { JoinSiteForm } from "@/components/portal/join-site-form"

export const metadata: Metadata = {
  title: "Add a site with a code",
}

// No organization needed. Somebody helping with one site should not have to
// create an organization to do it, which is what the old org-wide code forced.
export default function JoinPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Add a site with a code
        </h1>
        <p className="mt-1 text-muted-foreground">
          If someone asked you to help keep a shelter or lot up to date, they
          will have given you its code. The site appears on your dashboard and
          you can edit its details. It stays theirs.
        </p>
      </div>

      <JoinSiteForm />

      <p className="text-sm text-muted-foreground">
        Running a site nobody has listed yet?{" "}
        <Link href="/portal/create" className="font-medium underline">
          Create an organization and add it
        </Link>
        .
      </p>
    </div>
  )
}
