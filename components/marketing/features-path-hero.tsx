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

const pathSteps = [
  { label: "Tonight", detail: "Shelter or lot that fits" },
  { label: "Match", detail: "Hard rules remove what cannot" },
  { label: "Keys", detail: "Deadlines and a rent cushion" },
]

/** Sticky path hero for the features index. Different beat from the provider ops console. */
export function FeaturesPathHero({
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
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(motion.matches)
    sync()
    motion.addEventListener("change", sync)

    const update = () => {
      if (!sectionRef.current || motion.matches) {
        setProgress(motion.matches ? 1 : 0)
        return
      }
      const rect = sectionRef.current.getBoundingClientRect()
      setProgress(clamp01(-rect.top / (window.innerHeight * 1.25)))
    }

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      motion.removeEventListener("change", sync)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const p = reduceMotion ? 1 : progress
  const activeStep = Math.min(
    pathSteps.length - 1,
    Math.floor(p * pathSteps.length)
  )
  const pathFill = clamp01((activeStep + 1) / pathSteps.length)
  const panelIn = clamp01((p - 0.15) / 0.55)

  const copy = (
    <div className="max-w-xl">
      <Badge variant="outline" className="bg-background/70 backdrop-blur-sm">
        All features
      </Badge>
      <p className="mt-4 font-heading text-sm font-semibold tracking-[0.18em] text-primary uppercase">
        {site.name}
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{lede}</p>
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </div>
  )

  if (reduceMotion) {
    return (
      <section className="relative isolate overflow-hidden">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/90 to-background" />
        <Container className="relative grid gap-10 pt-28 pb-16 lg:grid-cols-2 lg:items-end">
          {copy}
          <PathPanel activeStep={pathSteps.length - 1} fill={1} />
        </Container>
        <Container className="relative pb-4">
          <PhotoCredit photo={photo} />
        </Container>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: "210vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-background">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.25 + (1 - p) * 0.2 }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-primary/15"
          aria-hidden
        />

        <Container className="relative flex h-full flex-col justify-end gap-10 pt-28 pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div
            style={{
              opacity: 0.55 + panelIn * 0.45,
              transform: `translateY(${(1 - panelIn) * 28}px)`,
            }}
          >
            {copy}
          </div>
          <div
            className="w-full max-w-md will-change-transform"
            style={{
              opacity: panelIn,
              transform: `translateX(${(1 - panelIn) * 40}px) scale(${0.94 + panelIn * 0.06})`,
            }}
          >
            <PathPanel activeStep={activeStep} fill={pathFill} />
          </div>
        </Container>

        <Container className="absolute inset-x-0 bottom-3">
          <PhotoCredit photo={photo} className="text-muted-foreground/80" />
        </Container>
      </div>
    </section>
  )
}

function PathPanel({
  activeStep,
  fill,
}: {
  activeStep: number
  fill: number
}) {
  return (
    <div
      className="rounded-2xl border bg-card/95 p-5 shadow-xl ring-1 ring-primary/15 backdrop-blur-md"
      aria-hidden
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        The path
      </p>
      <div className="relative mt-5 space-y-3">
        <div className="absolute top-3 bottom-3 left-[15px] w-px bg-muted" />
        <div
          className="absolute top-3 left-[15px] w-px bg-primary transition-[height] duration-300"
          style={{ height: `calc(${fill * 100}% - 12px)` }}
        />
        {pathSteps.map((step, i) => {
          const on = i === activeStep
          const done = i < activeStep
          return (
            <div
              key={step.label}
              className={cn(
                "relative flex items-start gap-3 rounded-xl px-2 py-2 transition-all duration-300",
                on && "bg-primary/8 ring-1 ring-primary/20"
              )}
            >
              <span
                className={cn(
                  "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  on
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/25 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <div>
                <p
                  className={cn(
                    "font-heading text-sm font-semibold",
                    on ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
