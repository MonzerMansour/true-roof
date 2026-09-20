"use client"

import type { ReactNode } from "react"

import { PortalSidebar } from "@/components/portal/portal-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type PortalShellProps = {
  children: ReactNode
  title?: string
  primaryListingId: string | null
  showAccess: boolean
}

export function PortalShell({
  children,
  title,
  primaryListingId,
  showAccess,
}: PortalShellProps) {
  return (
    <SidebarProvider>
      <PortalSidebar
        primaryListingId={primaryListingId}
        showAccess={showAccess}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {title ? (
            <h1 className="font-heading text-lg font-semibold">{title}</h1>
          ) : null}
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
