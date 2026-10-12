"use client"

import * as React from "react"
import Image from "next/image"
import type { ReactNode } from "react"

import { Container } from "@/components/marketing/container"
import { PhotoCredit } from "@/components/marketing/marketing-photo"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import type { Photo } from "@/lib/photos"
import { site } from "@/lib/site"

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

/** Sticky ops-console hero: photo veil peels to a live portal mock. */
export function ProviderOpsHero({
  photo,
  title,
  lede,
  actions,
}: {
  photo: Photo
  title: string
  lede: string
  actions?: ReactNode
}) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [progress, setProgress] = React.useState(0)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [interest, setInterest] = React.useState(3)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReduceMotion(motion.matches)
    syncMotion()
    motion.addEventListener("change", syncMotion)

    const update = () => {
      if (!sectionRef.current || motion.matches) {
        setProgress(motion.matches ? 1 : 0)
        return
      }
      const rect = sectionRef.current.getBoundingClientRect()
      const scrollable = window.innerHeight * 1.35
      setProgress(clamp01(-rect.top / scrollable))
    }

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      motion.removeEventListener("change", syncMotion)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  React.useEffect(() => {
    if (reduceMotion) {
      setInterest(12)
      return
    }
    if (progress < 0.35) return
    const id = window.setInterval(() => {
      setInterest((n) => (n >= 18 ? 12 : n + 1))
    }, 1400)
    return () => window.clearInterval(id)
  }, [progress, reduceMotion])

  const p = reduceMotion ? 1 : progress
  const veil = 1 - clamp01(p / 0.55)
  const consoleIn = clamp01((p - 0.2) / 0.5)
  const copyLift = clamp01((p - 0.45) / 0.4)

  const copyBlock = (
    <div className="max-w-xl text-white">
      <Badge variant="secondary" className="w-fit bg-white/15 text-white">
        For shelter and lot staff
      </Badge>
      <p className="mt-4 font-heading text-sm font-semibold tracking-[0.2em] text-white/80 uppercase">
        {site.name}
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="mt-4 text-base text-pretty text-white/85 sm:text-lg">
        {lede}
      </p>
      {actions ? (
        <div className="mt-6 flex flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  )

  if (reduceMotion) {
    return (
      <section className="relative isolate min-h-[32rem] overflow-hidden">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-primary/45 to-black/30" />
        <Container className="relative flex min-h-[32rem] flex-col justify-end gap-8 pt-28 pb-12 lg:flex-row lg:items-end lg:justify-between">
          {copyBlock}
          <PortalMock interest={interest} className="w-full max-w-md" />
        </Container>
        <Container className="relative pb-4">
          <PhotoCredit photo={photo} className="text-white/55" />
        </Container>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: "220vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-background">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-black/80 via-primary/50 to-black/40"
          style={{ opacity: Math.max(0.55, veil) }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-background"
          style={{ opacity: 1 - veil }}
          aria-hidden
        />

        <Container className="relative flex h-full flex-col justify-end gap-8 pt-28 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div
            style={{
              opacity: Math.max(0.35, 1 - copyLift * 0.15),
              transform: `translateY(${(1 - Math.max(copyLift, 0.2)) * 24}px)`,
            }}
          >
            {copyBlock}
          </div>

          <div
            className="w-full max-w-md will-change-transform"
            style={{
              opacity: consoleIn,
              transform: `translateY(${(1 - consoleIn) * 48}px) scale(${0.92 + consoleIn * 0.08})`,
            }}
          >
            <PortalMock interest={interest} />
          </div>
        </Container>

        <Container
          className="absolute inset-x-0 bottom-3"
          style={{ opacity: veil }}
        >
          <PhotoCredit photo={photo} className="text-white/55" />
        </Container>
      </div>
    </section>
  )
}

function PortalMock({
  interest,
  className,
}: {
  interest: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl ring-1 ring-primary/15 backdrop-blur-md",
        className
      )}
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Site row
          </p>
          <p className="font-heading text-lg font-semibold">Oak Street Shelter</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success-text">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          Live
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/70 px-2 py-3">
          <dt className="text-[11px] text-muted-foreground">Interest</dt>
          <dd className="font-heading text-xl font-semibold tabular-nums">
            {interest}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/70 px-2 py-3">
          <dt className="text-[11px] text-muted-foreground">Beds</dt>
          <dd className="font-heading text-xl font-semibold tabular-nums">4</dd>
        </div>
        <div className="rounded-xl bg-muted/70 px-2 py-3">
          <dt className="text-[11px] text-muted-foreground">Pets</dt>
          <dd className="font-heading text-xl font-semibold">Yes</dd>
        </div>
      </dl>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/3 rounded-full bg-primary transition-all duration-700" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Confidence holds while staff keep the row current.
      </p>
    </div>
  )
}
