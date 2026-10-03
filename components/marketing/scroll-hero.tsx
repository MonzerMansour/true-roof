"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import type { Photo } from "@/lib/photos"
import { site } from "@/lib/site"

type SideImage = {
  photo: Photo
  position: "left" | "right"
  span: number
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function ScrollHero({
  centerPhoto,
  sideImages,
}: {
  centerPhoto: Photo
  sideImages: SideImage[]
}) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mobile = window.matchMedia("(max-width: 767px)")
    const syncMotion = () => setReduceMotion(motion.matches)
    const syncMobile = () => setIsMobile(mobile.matches)
    syncMotion()
    syncMobile()
    motion.addEventListener("change", syncMotion)
    mobile.addEventListener("change", syncMobile)

    const handleScroll = () => {
      if (!sectionRef.current || motion.matches) {
        setScrollProgress(motion.matches ? 1 : 0)
        return
      }
      const rect = sectionRef.current.getBoundingClientRect()
      // Open, brief beat, then veil. Short pause only between the last two.
      const scrollableHeight = window.innerHeight * 1.55
      const scrolled = -rect.top
      setScrollProgress(clamp01(scrolled / scrollableHeight))
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener("scroll", handleScroll)
      motion.removeEventListener("change", syncMotion)
      mobile.removeEventListener("change", syncMobile)
    }
  }, [])

  const progress = reduceMotion ? 1 : scrollProgress

  // Open the bento, sit briefly, then fade the veil and copy.
  const openPhase = clamp01(progress / 0.48)
  const textOpacity = Math.max(0, 1 - openPhase / 0.2)
  const imageProgress = clamp01((openPhase - 0.15) / 0.85)
  const veilProgress = clamp01((progress - 0.58) / 0.28)
  const copyProgress = clamp01((progress - 0.64) / 0.28)

  const centerWidth = 100 - imageProgress * 58
  const centerHeight = 100 - imageProgress * 30
  const sideWidth = imageProgress * 22
  const sideOpacity = imageProgress
  const sideTranslateLeft = -100 + imageProgress * 100
  const sideTranslateRight = 100 - imageProgress * 100
  const borderRadius = imageProgress * 24
  const gap = imageProgress * 16
  const sideTranslateY = isMobile ? -(imageProgress * 15) : 0
  const brand = "TRUE ROOF"

  const taglineBlock = (
    <div className="w-full max-w-2xl px-6 text-center md:px-12">
      <p className="text-2xl leading-relaxed text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
        {site.tagline}
        <br />
        <span className="text-muted-foreground">
          Shelter and parking first. Then the year that keeps the keys.
        </span>
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/places"
          className={cn(buttonVariants({ size: "touch" }), "sm:w-auto")}
        >
          See places near you
        </Link>
        <Link
          href="/get-started/find-a-place"
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "sm:w-auto"
          )}
        >
          Answer a few questions first
        </Link>
      </div>
      <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
        No account needed. Run a shelter or lot?{" "}
        <Link href="/for-providers" className="font-medium underline">
          Go to the provider side
        </Link>
        .
      </p>
    </div>
  )

  if (reduceMotion) {
    return (
      <section className="relative bg-background">
        <div className="relative h-[70vh] min-h-[28rem] w-full overflow-hidden">
          <Image
            src={centerPhoto.src}
            alt={centerPhoto.alt}
            fill
            priority
            sizes="100vw"
            quality={95}
            className="object-cover"
          />
        </div>
        <div className="flex justify-center py-24">{taglineBlock}</div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: "255vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-background">
        <div className="relative flex h-full w-full items-center justify-center">
          <div
            className="relative flex h-full w-full items-stretch justify-center"
            style={{
              gap: `${gap}px`,
              padding: `${imageProgress * 16}px`,
              paddingBottom: `${60 + imageProgress * 40}px`,
            }}
          >
            <div
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "left")
                .map((img) => (
                  <div
                    key={img.photo.src}
                    className="relative min-h-0 overflow-hidden will-change-transform"
                    style={{
                      flex: img.span,
                      borderRadius: `${borderRadius}px`,
                    }}
                  >
                    <Image
                      src={img.photo.src}
                      alt={img.photo.alt}
                      fill
                      sizes="22vw"
                      className="object-cover"
                      quality={90}
                    />
                  </div>
                ))}
            </div>

            <div
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: `${centerHeight}%`,
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Image
                src={centerPhoto.src}
                alt={centerPhoto.alt}
                fill
                priority
                sizes="100vw"
                quality={95}
                className="object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/70 via-black/25 to-transparent"
                aria-hidden
              />
              <div
                className="absolute inset-0 flex items-end overflow-hidden px-3 pb-4 sm:px-5 sm:pb-6"
                style={{ opacity: textOpacity }}
              >
                <h1
                  className="w-full whitespace-nowrap font-heading text-[clamp(2rem,9vw,7.5rem)] leading-none font-semibold tracking-tight text-white"
                  aria-label={site.name}
                >
                  {brand.split("").map((letter, index) => (
                    <span
                      key={`${letter}-${index}`}
                      className="inline-block animate-[slideUp_0.8s_ease-out_forwards] opacity-0"
                      style={{
                        animationDelay: `${index * 0.06}s`,
                        transition: "all 1.5s",
                        transitionTimingFunction:
                          "cubic-bezier(0.86, 0, 0.07, 1)",
                      }}
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </span>
                  ))}
                </h1>
              </div>
            </div>

            <div
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "right")
                .map((img) => (
                  <div
                    key={img.photo.src}
                    className="relative min-h-0 overflow-hidden will-change-transform"
                    style={{
                      flex: img.span,
                      borderRadius: `${borderRadius}px`,
                    }}
                  >
                    <Image
                      src={img.photo.src}
                      alt={img.photo.alt}
                      fill
                      sizes="22vw"
                      className="object-cover"
                      quality={90}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Soft veil: fades in over the open bento instead of a hard cut. */}
          <div
            className="pointer-events-none absolute inset-0 z-20 bg-background"
            style={{ opacity: veilProgress }}
            aria-hidden
          />

          <div
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{
              opacity: copyProgress,
              transform: `translateY(${(1 - copyProgress) * 28}px)`,
              pointerEvents: copyProgress > 0.4 ? "auto" : "none",
            }}
          >
            {taglineBlock}
          </div>
        </div>
      </div>
    </section>
  )
}
