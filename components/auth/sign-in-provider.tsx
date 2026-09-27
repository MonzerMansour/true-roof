"use client"

import * as React from "react"

import { safeNextPath } from "@/lib/auth/next-path"

type SignInContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  next: string | null
  openSignIn: (opts?: { next?: string }) => void
}

const SignInContext = React.createContext<SignInContextValue | null>(null)

export function SignInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [next, setNext] = React.useState<string | null>(null)

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      next,
      openSignIn: (opts?: { next?: string }) => {
        setNext(safeNextPath(opts?.next))
        setOpen(true)
      },
    }),
    [open, next]
  )

  return <SignInContext.Provider value={value}>{children}</SignInContext.Provider>
}

export function useSignIn() {
  const context = React.useContext(SignInContext)

  if (!context) {
    throw new Error("useSignIn must be used within SignInProvider")
  }

  return context
}
