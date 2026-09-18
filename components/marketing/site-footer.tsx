"use client"

import Link from "next/link"

import { useSignIn } from "@/components/auth/sign-in-provider"
import { Container } from "@/components/marketing/container"
import { LogoLockup } from "@/components/marketing/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "cn"
import { featureNav, primaryNav, site } from "@/lib/site"

export function SiteFooter() {
  const { openSignIn } = useSignIn()

  return (
    <footer className="border-t bg-muted/30">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <LogoLockup className="w-36" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {site.tagline} Built for people first. Shelters and lots come second
            — and they get a real dashboard.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">Who it is for</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium">What it does</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {featureNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Account</p>
          <button
            type="button"
            onClick={openSignIn}
            className="w-fit text-left text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={openSignIn}
            className={cn(buttonVariants({ size: "sm" }), "w-fit")}
          >
            Get started
          </button>
          <div className="pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Display</p>
            <ThemeToggle />
          </div>
        </div>
      </Container>

      <Separator />

      <Container className="flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Photographs are real stills from Unsplash, used under the Unsplash
          License.
        </p>
        <p>
          Crisis: 911 · 988 · local DV line. True Roof never claims a case was
          approved.
        </p>
      </Container>
    </footer>
  )
}
