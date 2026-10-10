"use client"

import { useRouter } from "next/navigation"
import { IconLogout, IconSettings, IconUser } from "@tabler/icons-react"

import { useSession } from "@/components/auth/session-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Email, Settings, and Sign out from the top right corner. The staff portal
 * uses the same menu with its own settings page. */
export function SeekerAccountMenu({
  settingsHref = "/settings",
}: {
  settingsHref?: string
}) {
  const router = useRouter()
  const { session, signOut } = useSession()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Account"
          />
        }
      >
        <IconUser />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{session?.email ?? "Signed in"}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(settingsHref)}>
          <IconSettings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <IconLogout />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
