import type { ReactNode } from "react"
import { Suspense } from "react"

import { AppChrome } from "@/components/app/app-chrome"
import { SeekerTour } from "@/components/app/seeker-tour"
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
      {/* In the layout rather than on a page, so moving between steps does not
          unmount the tour and lose where the person had got to. */}
      <SeekerTour />
    </AppChrome>
  )
}
