"use client"

import type { ReactNode } from "react"

import { SignInProvider } from "@/components/auth/sign-in-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <SignInProvider>
          {children}
          <Toaster />
        </SignInProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
