"use client"

import * as React from "react"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import { cn } from "cn"
import type { Feature } from "@/lib/features"

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

/** Scroll-scrubbed feature cards. Horizontal focus moves as you scroll. */
export function FeaturesCardRail({ features }: { features: Feature[] }) {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const [progress, setProgress] = React.useState(0)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [hovered, setHovered] = React.useState<string | null>(null)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener("change", sync)

    const update = () => {
      if (!sectionRef.current) return
      if (media.matches) {
        setProgress(1)
        return
      }
      const rect = sectionRef.current.getBoundingClientRect()
      const range = Math.max(1, sectionRef.current.offsetHeight - window.innerHeight)
      setProgress(clamp01(-rect.top / range))
    }

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      media.removeEventListener("change", sync)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const active = Math.min(
    features.length - 1,
    Math.floor(progress * features.length)
  )

  if (reduceMotion) {
    return (
      <section className="border-t bg-primary/[0.03] py-16">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.slug} feature={feature} emphasized />
            ))}
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="border-t bg-primary/[0.03]">
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${Math.max(features.length, 3) * 55}vh` }}
      >
        <div className="sticky top-0 flex min-h-screen items-center py-16">
          <Container className="w-full">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Pick a part of the path
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Scroll to move through each feature. Tap any card to open it.
                </p>
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(features.length).padStart(2, "0")}
              </p>
            </div>

            <div className="flex gap-4 overflow-hidden pb-2">
              {features.map((feature, i) => {
                const distance = Math.abs(i - active)
                const focus = hovered === feature.slug || i === active
                const scale = focus ? 1 : distance === 1 ? 0.94 : 0.88
                const opacity = focus ? 1 : distance === 1 ? 0.72 : 0.4
                return (
                  <div
                    key={feature.slug}
                    className="w-[min(18rem,78vw)] shrink-0 transition-all duration-500 will-change-transform sm:w-72"
                    style={{
                      transform: `translateX(${(active - i) * -8}px) scale(${scale})`,
                      opacity,
                    }}
                    onMouseEnter={() => setHovered(feature.slug)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <FeatureCard feature={feature} emphasized={focus} />
                  </div>
                )
              })}
            </div>

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${((active + 1) / features.length) * 100}%`,
                }}
              />
            </div>
          </Container>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  emphasized,
}: {
  feature: Feature
  emphasized?: boolean
}) {
  return (
    <Link href={`/features/${feature.slug}`} className="block h-full">
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border bg-card ring-1 transition-all duration-300",
          emphasized
            ? "shadow-lg ring-primary/25"
            : "ring-primary/10 hover:bg-muted/40"
        )}
      >
        <MarketingPhoto
          photo={feature.photo}
          className="h-40"
          sizes="(min-width: 1024px) 20vw, 80vw"
        />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <p className="text-xs font-medium text-primary">{feature.eyebrow}</p>
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            {feature.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {feature.lede}
          </p>
        </div>
      </article>
    </Link>
  )
}
