"use client"

import type { ReactNode } from "react"

import { SessionProvider } from "@/components/auth/session-provider"
import { SignInProvider } from "@/components/auth/sign-in-provider"
import { ThemeCorner } from "@/components/theme-corner"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { VoiceTypingButton } from "@/components/voice/voice-typing-button"
import type { AppSession } from "@/lib/auth/session"

export function AppProviders({
  session,
  children,
}: {
  session: AppSession | null
  children: ReactNode
}) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <SessionProvider initial={session}>
          <SignInProvider>
            {children}
            <VoiceTypingButton />
            <ThemeCorner />
            <Toaster />
          </SignInProvider>
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
