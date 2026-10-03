"use client"

import type { ReactNode } from "react"

import { SeekerAppShell } from "@/components/app/seeker-app-shell"
import { useSession } from "@/components/auth/session-provider"
import { AppFooter } from "@/components/marketing/app-footer"
import { FloatingHeader } from "@/components/marketing/floating-header"
import { SiteHeader } from "@/components/marketing/site-header"

/**
 * Seekers get the closable sidebar (default open). Guests share the marketing
 * floating pill. Providers keep the sticky app bar for portal nav.
 */
export function AppChrome({ children }: { children: ReactNode }) {
  const { session } = useSession()

  if (session?.role === "seeker") {
    return <SeekerAppShell>{children}</SeekerAppShell>
  }

  if (!session) {
    return (
      <div className="flex min-h-svh flex-col">
        <FloatingHeader />
        <main id="main" className="flex-1 pt-20">
          {children}
        </main>
        <AppFooter />
      </div>
    )
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
