"use client"

import * as React from "react"

type SignInContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openSignIn: () => void
}

const SignInContext = React.createContext<SignInContextValue | null>(null)

export function SignInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      openSignIn: () => setOpen(true),
    }),
    [open]
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
