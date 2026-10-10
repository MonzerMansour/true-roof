"use client"

import type { ReactNode } from "react"

import { SeekerAccountMenu } from "@/components/app/seeker-account-menu"
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
      {/* This had no id at all, so the root skip link pointed at nothing on
          every portal page. */}
      <SidebarInset id="main" tabIndex={-1} className="outline-none">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 px-4 shadow-sm backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {title ? (
            <h1 className="font-heading text-lg font-semibold">{title}</h1>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <SeekerAccountMenu settingsHref="/portal/settings" />
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
