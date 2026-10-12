"use client"

import * as React from "react"

import { Container } from "@/components/marketing/container"
import { cn } from "cn"

export type PortalTimelineStep = {
  title: string
  body: string
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

/** Scroll-scrubbed vertical timeline for portal capabilities. */
export function PortalTimeline({
  heading,
  lede,
  steps,
}: {
  heading: string
  lede: string
  steps: PortalTimelineStep[]
}) {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const [progress, setProgress] = React.useState(0)
  const [reduceMotion, setReduceMotion] = React.useState(false)
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

  const activeIndex = Math.min(
    steps.length - 1,
    Math.floor(progress * steps.length)
  )

  if (reduceMotion) {
    return (
      <section className="bg-primary/[0.03] py-20">
        <Container>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            {heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border bg-card p-6 ring-1 ring-primary/10"
              >
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 font-heading text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-base text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-primary/[0.03]">
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${steps.length * 85}vh` }}
      >
        <div className="sticky top-0 flex min-h-screen items-center py-16">
          <Container className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {heading}
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">{lede}</p>
              <ol className="mt-8 space-y-3" aria-label="Portal steps">
                {steps.map((step, i) => {
                  const on = i === activeIndex
                  const passed = i < activeIndex
                  return (
                    <li
                      key={step.title}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300",
                        on
                          ? "border-primary/40 bg-card shadow-sm ring-1 ring-primary/20"
                          : "border-transparent bg-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors",
                          on
                            ? "bg-primary text-primary-foreground"
                            : passed
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={cn(
                          "font-heading text-sm font-semibold sm:text-base",
                          on ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="relative min-h-[18rem]">
              {steps.map((step, i) => {
                const distance = Math.abs(i - activeIndex)
                const opacity =
                  i === activeIndex ? 1 : distance === 1 ? 0.12 : 0
                return (
                  <article
                    key={step.title}
                    className={cn(
                      "absolute inset-0 rounded-3xl border bg-card p-8 ring-1 ring-primary/15 transition-all duration-500 will-change-transform sm:p-10",
                      i === activeIndex ? "shadow-lg" : "shadow-none"
                    )}
                    style={{
                      opacity,
                      transform: `translateY(${(i - activeIndex) * 18}px) scale(${i === activeIndex ? 1 : 0.96})`,
                      pointerEvents: i === activeIndex ? "auto" : "none",
                    }}
                    aria-hidden={i !== activeIndex}
                  >
                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                      {String(i + 1).padStart(2, "0")} /{" "}
                      {String(steps.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {step.body}
                    </p>
                    <div
                      className="mt-8 h-1 overflow-hidden rounded-full bg-muted"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300"
                        style={{
                          width: `${((activeIndex + 1) / steps.length) * 100}%`,
                        }}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </Container>
        </div>
      </div>
    </section>
  )
}
