"use client"

import * as React from "react"

import { cn } from "cn"

/** Staggered slide-up as each place card enters the viewport. */
export function PlaceCardEntrance({
  index,
  children,
}: {
  index: number
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)

  React.useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(motion.matches)
    sync()
    motion.addEventListener("change", sync)

    if (motion.matches) {
      setVisible(true)
      return () => motion.removeEventListener("change", sync)
    }

    const node = ref.current
    if (!node) return () => motion.removeEventListener("change", sync)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      motion.removeEventListener("change", sync)
    }
  }, [])

  const delay = Math.min(index, 8) * 70

  return (
    <div
      ref={ref}
      className={cn(
        "h-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible || reduceMotion
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      )}
      style={
        reduceMotion
          ? undefined
          : { transitionDelay: visible ? `${delay}ms` : "0ms" }
      }
    >
      {children}
    </div>
  )
}
