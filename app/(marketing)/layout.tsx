import type { ReactNode } from "react"
import { Suspense } from "react"

import { MarketingSignInHandler } from "@/components/marketing/marketing-sign-in-handler"
import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <MarketingSignInHandler />
      </Suspense>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
