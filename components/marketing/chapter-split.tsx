"use client"

import * as React from "react"
import Link from "next/link"

import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import type { Photo } from "@/lib/photos"

export function ChapterSplit({
  title,
  left,
  right,
}: {
  title: string
  left: {
    photo: Photo
    badge: string
    heading: string
    body: string
    href: string
    cta: string
  }
  right: {
    photo: Photo
    badge: string
    heading: string
    body: string
    href: string
    cta: string
  }
}) {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const [leftX, setLeftX] = React.useState(-100)
  const [rightX, setRightX] = React.useState(100)
  const [titleOpacity, setTitleOpacity] = React.useState(1)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)

  const update = React.useCallback(() => {
    if (!sectionRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLeftX(0)
      setRightX(0)
      setTitleOpacity(0.35)
      return
    }
    const rect = sectionRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const sectionHeight = sectionRef.current.offsetHeight
    const scrollableRange = Math.max(1, sectionHeight - windowHeight)
    const progress = Math.max(0, Math.min(1, -rect.top / scrollableRange))
    setLeftX((1 - progress) * -100)
    setRightX((1 - progress) * 100)
    setTitleOpacity(1 - progress * 0.85)
  }, [])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener("change", sync)

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
  }, [update])

  return (
    <section className="bg-background">
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: reduceMotion ? "auto" : "200vh" }}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            reduceMotion ? "relative py-16" : "sticky top-0 h-screen"
          )}
        >
          <div className="relative w-full">
            <div
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-6"
              style={{ opacity: titleOpacity }}
            >
              <h2 className="text-center font-heading text-[11vw] leading-[0.95] font-semibold tracking-tighter text-primary/90 md:text-[8vw] lg:text-[6vw]">
                {title}
              </h2>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 px-6 md:grid-cols-2 md:px-12 lg:px-20">
              <ChapterCard
                {...left}
                style={{
                  transform: `translate3d(${leftX}%, 0, 0)`,
                }}
              />
              <ChapterCard
                {...right}
                style={{
                  transform: `translate3d(${rightX}%, 0, 0)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChapterCard({
  photo,
  badge,
  heading,
  body,
  href,
  cta,
  style,
}: {
  photo: Photo
  badge: string
  heading: string
  body: string
  href: string
  cta: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-primary/20 will-change-transform"
      style={style}
    >
      <MarketingPhoto
        photo={photo}
        className="absolute inset-0 h-full"
        sizes="(min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-primary/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white sm:p-6">
        <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
          {badge}
        </p>
        <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {heading}
        </h3>
        <p className="max-w-md text-sm text-pretty text-white/85 sm:text-base">
          {body}
        </p>
        <Link
          href={href}
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-white text-foreground hover:bg-white/90"
          )}
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}
