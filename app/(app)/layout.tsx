import type { ReactNode } from "react"

import { AppChrome } from "@/components/app/app-chrome"

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppChrome>{children}</AppChrome>
}
