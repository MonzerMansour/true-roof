import type { ReactNode } from "react"
import { Suspense } from "react"

import { MarketingChrome } from "@/components/marketing/marketing-chrome"
import { MarketingSignInHandler } from "@/components/marketing/marketing-sign-in-handler"
import { SiteFooter } from "@/components/marketing/site-footer"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <MarketingSignInHandler />
      </Suspense>
      <MarketingChrome />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
