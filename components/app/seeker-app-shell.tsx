"use client"

import type { ReactNode } from "react"

import { SeekerAccountMenu } from "@/components/app/seeker-account-menu"
import { SeekerSidebar } from "@/components/app/seeker-sidebar"
import { SignInDialog } from "@/components/auth/sign-in-dialog"
import { AppFooter } from "@/components/marketing/app-footer"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function SeekerAppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <SeekerSidebar />
      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger aria-label="Close or open sidebar" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <SeekerAccountMenu />
          </div>
        </header>
        <div id="main" className="flex flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </div>
        <SignInDialog />
      </SidebarInset>
    </SidebarProvider>
  )
}
