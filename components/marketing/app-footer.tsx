"use client"

import Link from "next/link"

import { useSession } from "@/components/auth/session-provider"
import { Container } from "@/components/marketing/container"
import { site } from "@/lib/site"

export function AppFooter() {
  const { session } = useSession()
  const homeHref = session
    ? session.role === "provider"
      ? "/portal"
      : "/home"
    : "/"

  return (
    <footer className="border-t bg-background">
      <Container className="flex flex-col gap-2 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <Link href={homeHref} className="font-medium text-foreground hover:underline">
            {site.name}
          </Link>
          {" · "}
          <Link href="/places" className="hover:text-foreground">
            Places
          </Link>
          {session?.role === "seeker" ? (
            <>
              {" · "}
              <Link href="/financials" className="hover:text-foreground">
                Financials
              </Link>
            </>
          ) : null}
        </p>
        <p>
          Crisis:{" "}
          <a href="tel:911" className="hover:text-foreground">
            911
          </a>
          {" · "}
          <a href="tel:988" className="hover:text-foreground">
            988
          </a>
          {" · "}
          <a href="tel:+18007997233" className="hover:text-foreground">
            DV 1-800-799-7233
          </a>
        </p>
      </Container>
    </footer>
  )
}
