"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import type { AppSession } from "@/lib/auth/session"

type SessionContextValue = {
  session: AppSession | null
  signOut: () => Promise<void>
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

export function SessionProvider({
  initial,
  children,
}: {
  initial: AppSession | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const [session, setSession] = React.useState<AppSession | null>(initial)

  React.useEffect(() => {
    setSession(initial)
  }, [initial])

  React.useEffect(() => {
    const client = createClient()
    if (!client) return

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      if (!next?.user) {
        setSession(null)
        return
      }

      setSession({
        id: next.user.id,
        email: next.user.email ?? null,
        role: next.user.user_metadata?.role === "provider" ? "provider" : "seeker",
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = React.useCallback(async () => {
    const client = createClient()
    await client?.auth.signOut()
    setSession(null)
    router.push("/")
    router.refresh()
  }, [router])

  const value = React.useMemo(
    () => ({ session, signOut }),
    [session, signOut]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const context = React.useContext(SessionContext)

  if (!context) {
    throw new Error("useSession must be used within SessionProvider")
  }

  return context
}
