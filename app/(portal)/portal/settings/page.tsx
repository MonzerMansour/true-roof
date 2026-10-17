import type { Metadata } from "next"

import { DisplaySettings } from "@/components/app/display-settings"
import { ReplayTourButton } from "@/components/app/replay-tour-button"
import { SignOutButton } from "@/components/auth/sign-out-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPortalContext } from "@/lib/portal/queries"

export const metadata: Metadata = {
  title: "Settings",
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

export default async function PortalSettingsPage() {
  const context = await getPortalContext()
  const membership = context?.primaryMembership

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Make the text bigger, turn up the contrast, turn on voice typing,
          and see your account and where you work.
        </p>
      </div>

      <DisplaySettings />

      <Card>
        <CardHeader>
          <CardTitle>Tour of the portal</CardTitle>
          <CardDescription>
            A walk through each page, what it is for, and the one thing to do
            there. You can close it at any point and it never covers the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReplayTourButton
            tour="provider"
            audience={{
              signedIn: true,
              isDirector: Boolean(context?.isDirector),
              hasOrganization: Boolean(context?.organization),
              primaryListingId: context?.listings[0]?.id ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as a provider.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {context?.email ?? "Not available"}
          </p>
          <SignOutButton />
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
