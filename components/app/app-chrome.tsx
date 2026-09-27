"use client"

import type { ReactNode } from "react"

import { SeekerAppShell } from "@/components/app/seeker-app-shell"
import { useSession } from "@/components/auth/session-provider"
import { AppFooter } from "@/components/marketing/app-footer"
import { SiteHeader } from "@/components/marketing/site-header"

/**
 * Seekers get the closable sidebar (default open). Guests and anyone without
 * a seeker session keep the marketing top bar.
 */
export function AppChrome({ children }: { children: ReactNode }) {
  const { session } = useSession()

  if (session?.role === "seeker") {
    return <SeekerAppShell>{children}</SeekerAppShell>
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  )
}
