"use client"

import { Button } from "@/components/ui/button"
import { useSession } from "@/components/auth/session-provider"

export function SignOutButton({ variant = "outline" }: { variant?: "outline" | "destructive" }) {
  const { session, signOut } = useSession()

  if (!session) return null

  return (
    <Button variant={variant} onClick={() => void signOut()}>
      Sign out
    </Button>
  )
}
