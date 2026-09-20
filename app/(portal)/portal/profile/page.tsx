import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPortalContext } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Profile",
}

const roleLabel: Record<string, string> = {
  director: "Director",
  manager: "Manager",
  staff: "Staff",
}

const statusLabel: Record<string, string> = {
  active: "Active",
  pending: "Pending approval",
  rejected: "Not approved",
}

export default async function ProfilePage() {
  const context = await getPortalContext()
  const membership = context?.primaryMembership

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your account and where you work. More settings arrive later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as a provider.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {context?.email ?? "Not available"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
          <CardDescription>
            {membership
              ? "Your role at this organization."
              : "You have not joined or created a site yet."}
          </CardDescription>
        </CardHeader>
        {membership ? (
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Organization: </span>
              {context?.organization?.name ?? "Unknown"}
            </p>
            <p>
              <span className="text-muted-foreground">Role: </span>
              {roleLabel[membership.role] ?? membership.role}
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              {statusLabel[membership.status] ?? membership.status}
            </p>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}
