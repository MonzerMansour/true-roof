"use client"

import * as React from "react"
import Link from "next/link"
import { IconMenu2, IconX } from "@tabler/icons-react"

import { useSession } from "@/components/auth/session-provider"
import { SignInDialog } from "@/components/auth/sign-in-dialog"
import { useSignIn } from "@/components/auth/sign-in-provider"
import { Logo } from "@/components/marketing/logo"
import { VoiceTypingToggle } from "@/components/voice/voice-typing-toggle"
import { cn } from "cn"

const links = [
  { href: "/places", label: "Places" },
  { href: "/features", label: "Features" },
  { href: "/for-providers", label: "For shelters" },
] as const

/** Evasion-style floating pill. Always frosted so type stays readable on the
 * bright hero illustration. */
export function FloatingHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { openSignIn } = useSignIn()
  const { session } = useSession()

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          "fixed top-4 left-1/2 z-50 w-[min(92%,42rem)] -translate-x-1/2 transition-all duration-300",
          isMenuOpen ? "rounded-2xl" : "rounded-full",
          isScrolled
            ? "bg-background/90 shadow-lg ring-1 ring-border/60 backdrop-blur-md"
            : "bg-background/85 shadow-md ring-1 ring-black/10 backdrop-blur-md dark:ring-white/10"
        )}
      >
        <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4 sm:pl-5">
          <Link
            href="/"
            aria-label="True Roof home"
            className="flex shrink-0 items-center"
          >
            <Logo
              showWordmark
              markClassName="h-5"
              className="text-foreground [&_span]:text-foreground"
            />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex"
            aria-label="Primary"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <VoiceTypingToggle />
            {session ? (
              <Link
                href={session.role === "provider" ? "/portal" : "/home"}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open app
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openSignIn()}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get started
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-full p-2 text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <IconX className="size-5" />
            ) : (
              <IconMenu2 className="size-5" />
            )}
          </button>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-border px-5 py-6 md:hidden">
            <nav className="flex flex-col gap-4" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <VoiceTypingToggle
                showLabel
                onToggled={() => setIsMenuOpen(false)}
              />
              <button
                type="button"
                className="mt-1 rounded-full bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground"
                onClick={() => {
                  setIsMenuOpen(false)
                  openSignIn()
                }}
              >
                Get started
              </button>
            </nav>
          </div>
        ) : null}
      </header>
      <SignInDialog />
    </>
  )
}
