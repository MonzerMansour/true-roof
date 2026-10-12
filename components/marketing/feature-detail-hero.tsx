"use client"

import * as React from "react"
import Image from "next/image"
import type { ReactNode } from "react"

import { Container } from "@/components/marketing/container"
import { PhotoCredit } from "@/components/marketing/marketing-photo"
import { Badge } from "@/components/ui/badge"
import type { Photo } from "@/lib/photos"

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

/** Compact sticky hero for a single feature page. */
export function FeatureDetailHero({
  photo,
  eyebrow,
  title,
  lede,
  chips,
  actions,
}: {
  photo: Photo
  eyebrow: string
  title: string
  lede: string
  chips?: string[]
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
      setProgress(clamp01(-rect.top / (window.innerHeight * 0.85)))
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
  const chipReveal = clamp01((p - 0.2) / 0.5)

  const body = (
    <>
      <Badge variant="secondary" className="w-fit bg-white/15 text-white">
        {eyebrow}
      </Badge>
      <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-pretty text-white/85 sm:text-lg">
        {lede}
      </p>
      {actions ? (
        <div className="mt-6 flex flex-wrap gap-2">{actions}</div>
      ) : null}
      {chips && chips.length > 0 ? (
        <ul className="mt-8 flex max-w-2xl flex-wrap gap-2">
          {chips.slice(0, 5).map((chip, i) => (
            <li
              key={chip}
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-all duration-500"
              style={{
                opacity: reduceMotion ? 1 : clamp01(chipReveal * 5 - i),
                transform: reduceMotion
                  ? undefined
                  : `translateY(${(1 - clamp01(chipReveal * 5 - i)) * 12}px)`,
              }}
            >
              {chip}
            </li>
          ))}
        </ul>
      ) : null}
      <PhotoCredit photo={photo} className="mt-6 text-white/55" />
    </>
  )

  if (reduceMotion) {
    return (
      <section className="relative isolate min-h-[22rem] overflow-hidden sm:min-h-[26rem]">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-primary/40 to-black/25" />
        <Container className="relative flex min-h-[22rem] flex-col justify-end pt-28 pb-10 text-white sm:min-h-[26rem]">
          {body}
        </Container>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: "160vh" }}>
      <div className="sticky top-0 h-[min(100vh,40rem)] overflow-hidden sm:h-[min(100vh,44rem)]">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{
            transform: `scale(${1.08 - p * 0.08})`,
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-primary/45 to-black/30"
          style={{ opacity: 0.75 + p * 0.2 }}
          aria-hidden
        />
        <Container
          className="relative flex h-full flex-col justify-end pt-28 pb-10 text-white"
          style={{
            transform: `translateY(${(1 - clamp01(p / 0.6)) * 20}px)`,
          }}
        >
          {body}
        </Container>
      </div>
    </section>
  )
}
