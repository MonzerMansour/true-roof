"use client"

import * as React from "react"
import Image from "next/image"
import type { ReactNode } from "react"

import { Container } from "@/components/marketing/container"
import { cn } from "cn"
import type { Photo } from "@/lib/photos"

/** Compact animated Places intro. Fits the app shell without a long sticky scrub. */
export function PlacesHero({
  photo,
  title,
  lede,
  footnote,
}: {
  photo: Photo
  title: string
  lede: string
  footnote?: ReactNode
}) {
  const [ready, setReady] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [freshness, setFreshness] = React.useState(0)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    const id = window.requestAnimationFrame(() => setReady(true))
    return () => {
      media.removeEventListener("change", sync)
      window.cancelAnimationFrame(id)
    }
  }, [])

  React.useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setFreshness((n) => (n + 1) % 3)
    }, 2200)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  const badges = [
    { label: "Live", className: "bg-success/15 text-success-text ring-success/30" },
    { label: "Recent", className: "bg-warning/15 text-warning-text ring-warning/30" },
    { label: "Call first", className: "bg-muted text-foreground ring-border" },
  ] as const

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/88 to-background" />

      <Container className="relative grid gap-8 pt-6 pb-12 sm:pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
        <div
          className={cn(
            "transition-all duration-700 ease-out",
            ready || reduceMotion
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <p className="text-sm font-medium text-primary">Places</p>
          <h1 className="mt-2 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{lede}</p>
          {footnote}
        </div>

        <div
          className={cn(
            "rounded-2xl border bg-card/90 p-4 ring-1 ring-primary/15 backdrop-blur-sm transition-all delay-150 duration-700 ease-out",
            ready || reduceMotion
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          )}
          aria-hidden
        >
          <div className="grid grid-cols-2 gap-3">
            <MiniCard
              title="Shelter"
              detail="Beds, intake, pets"
              delay={0}
              ready={ready || reduceMotion}
            />
            <MiniCard
              title="Safe parking"
              detail="Cars and RVs"
              delay={100}
              ready={ready || reduceMotion}
            />
          </div>
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">Freshness on every row</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((badge, i) => (
                <span
                  key={badge.label}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-all duration-500",
                    badge.className,
                    i === freshness ? "scale-105 shadow-sm" : "opacity-55"
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${[88, 55, 28][freshness]}%` }}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function MiniCard({
  title,
  detail,
  delay,
  ready,
}: {
  title: string
  detail: string
  delay: number
  ready: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-muted/60 px-3 py-3 transition-all duration-700",
        ready ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="font-heading text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
