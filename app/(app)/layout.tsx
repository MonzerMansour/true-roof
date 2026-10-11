import type { ReactNode } from "react"
import { Suspense } from "react"

import { AppChrome } from "@/components/app/app-chrome"
import { SignInUrlHandler } from "@/components/auth/sign-in-url-handler"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppChrome>
      {/* Reads search params, so it needs a boundary of its own rather than
          opting every page in this group out of static rendering. */}
      <Suspense fallback={null}>
        <SignInUrlHandler />
      </Suspense>
      {children}
    </AppChrome>
  )
}
