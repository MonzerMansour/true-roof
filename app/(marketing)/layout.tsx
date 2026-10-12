import type { ReactNode } from "react"
import { Suspense } from "react"

import { FeaturesTour } from "@/components/marketing/features-tour"
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
      {/* Scopes itself to the feature pages. In the layout rather than on a
          page, so stepping from one feature to the next does not unmount the
          tour and lose where the person had got to. */}
      <Suspense fallback={null}>
        <FeaturesTour />
      </Suspense>
    </>
  )
}
