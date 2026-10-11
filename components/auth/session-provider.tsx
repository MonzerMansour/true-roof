"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { SignOutDialog } from "@/components/auth/sign-out-dialog"
import { createClient } from "@/lib/supabase/client"
import { hasLocalData, removeLocalData } from "@/lib/privacy/local-data"
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

  const [askingAboutLocalData, setAskingAboutLocalData] =
    React.useState(false)
  // Set by whichever button was pressed, so the dialog closing afterwards is
  // not also read as a dismissal and does not sign the person out twice.
  const decided = React.useRef(false)

  const finishSignOut = React.useCallback(
    async (removeLocal: boolean) => {
      if (removeLocal) removeLocalData()

      const client = createClient()
      await client?.auth.signOut()
      setSession(null)
      router.push("/")
      router.refresh()
    },
    [router]
  )

  // Asks what to do with the information on this phone, then signs out.
  //
  // The question is skipped when there is nothing on the phone to decide
  // about, so somebody who only ever browsed is not made to answer it. The
  // sign-out itself is never conditional on the answer: every path through
  // the dialog, dismissal included, ends signed out.
  const signOut = React.useCallback(async () => {
    if (!hasLocalData()) {
      await finishSignOut(false)
      return
    }

    decided.current = false
    setAskingAboutLocalData(true)
  }, [finishSignOut])

  const value = React.useMemo(
    () => ({ session, signOut }),
    [session, signOut]
  )

  return (
    <SessionContext.Provider value={value}>
      {children}
      {/* In the provider, so all four sign-out buttons get the same question
          without each one having to remember to ask it. */}
      <SignOutDialog
        open={askingAboutLocalData}
        onKeep={() => {
          if (decided.current) return
          decided.current = true
          setAskingAboutLocalData(false)
          void finishSignOut(false)
        }}
        onRemove={() => {
          decided.current = true
          setAskingAboutLocalData(false)
          void finishSignOut(true)
        }}
      />
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = React.useContext(SessionContext)

  if (!context) {
    throw new Error("useSession must be used within SessionProvider")
  }

  return context
}
