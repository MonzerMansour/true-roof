"use client"

import * as React from "react"
import Link from "next/link"

import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import type { Photo } from "@/lib/photos"

export type GallerySlide = {
  photo: Photo
  eyebrow: string
  title: string
  body: string
  href: string
}

export function ScrollGallery({
  slides,
  label = "What True Roof does",
}: {
  slides: GallerySlide[]
  label?: string
}) {
  const galleryRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [sectionHeight, setSectionHeight] = React.useState("100vh")
  const [translateX, setTranslateX] = React.useState(0)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)

  // Cap how far you have to scroll so a handful of cards does not feel endless.
  const scrollFactor = 0.55

  const updateTransform = React.useCallback(() => {
    if (!galleryRef.current || !containerRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTranslateX(0)
      return
    }

    const rect = galleryRef.current.getBoundingClientRect()
    const containerWidth = containerRef.current.scrollWidth
    const viewportWidth = window.innerWidth
    const totalScrollDistance = Math.max(
      1,
      (containerWidth - viewportWidth) * scrollFactor
    )
    const scrolled = Math.max(0, -rect.top)
    const progress = Math.min(1, scrolled / totalScrollDistance)
    setTranslateX(progress * -(containerWidth - viewportWidth))
  }, [])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReduceMotion(media.matches)
    syncMotion()
    media.addEventListener("change", syncMotion)

    const calculateHeight = () => {
      if (!containerRef.current || media.matches) {
        setSectionHeight("auto")
        return
      }
      const containerWidth = containerRef.current.scrollWidth
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const travel = Math.max(0, containerWidth - viewportWidth) * scrollFactor
      setSectionHeight(`${viewportHeight + travel}px`)
    }

    const timer = window.setTimeout(calculateHeight, 100)
    window.addEventListener("resize", calculateHeight)

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateTransform)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    updateTransform()

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("resize", calculateHeight)
      window.removeEventListener("scroll", handleScroll)
      media.removeEventListener("change", syncMotion)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [updateTransform])

  if (reduceMotion) {
    return (
      <section className="bg-background py-16">
        <p className="mb-6 px-6 text-center text-sm font-medium tracking-wide text-primary uppercase">
          {label}
        </p>
        <div className="flex gap-4 overflow-x-auto px-6 pb-2">
          {slides.map((slide) => (
            <FeatureSlideCard key={slide.href} slide={slide} compact />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      ref={galleryRef}
      className="relative bg-background"
      style={{ height: sectionHeight }}
      aria-label={label}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <p className="absolute top-8 left-0 z-10 w-full px-6 text-center text-sm font-medium tracking-wide text-primary uppercase">
          {label}
        </p>
        <div className="flex h-full items-center">
          <div
            ref={containerRef}
            className="flex gap-4 px-6 will-change-transform md:gap-5"
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
            }}
          >
            {slides.map((slide, index) => (
              <FeatureSlideCard
                key={slide.href}
                slide={slide}
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureSlideCard({
  slide,
  priority,
  compact,
}: {
  slide: GallerySlide
  priority?: boolean
  compact?: boolean
}) {
  return (
    <Link
      href={slide.href}
      className={
        compact
          ? "relative block h-[48vh] w-[72vw] shrink-0 overflow-hidden rounded-2xl ring-1 ring-primary/15 md:w-[40vw]"
          : "relative block h-[62vh] w-[78vw] shrink-0 overflow-hidden rounded-2xl ring-1 ring-primary/15 md:w-[48vw] lg:w-[36vw]"
      }
    >
      <MarketingPhoto
        photo={slide.photo}
        priority={priority}
        className="absolute inset-0 h-full"
        sizes="50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-primary/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white sm:p-6">
        <p className="text-xs font-medium tracking-wide text-white/75 uppercase">
          {slide.eyebrow}
        </p>
        <h3 className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {slide.title}
        </h3>
        <p className="max-w-md text-sm text-pretty text-white/85">{slide.body}</p>
      </div>
    </Link>
  )
}
