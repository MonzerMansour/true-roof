"use client"

import { useSession } from "@/components/auth/session-provider"
import { FloatingHeader } from "@/components/marketing/floating-header"
import { SiteHeader } from "@/components/marketing/site-header"

/** Marketing routes share the frosted floating pill. Logged-in visitors keep
 * the richer sticky bar so account and app nav stay one click away. */
export function MarketingChrome() {
  const { session } = useSession()

  if (session) {
    return <SiteHeader />
  }

  return <FloatingHeader />
}
