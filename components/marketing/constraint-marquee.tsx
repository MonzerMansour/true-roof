"use client"

import * as React from "react"

import { cn } from "cn"

/** Horizontal marquee of parking constraints. Pauses on hover and focus. */
export function ConstraintMarquee({
  items,
  className,
}: {
  items: string[]
  className?: string
}) {
  const [paused, setPaused] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  const row = [...items, ...items]

  if (reduceMotion) {
    return (
      <ul className={cn("flex flex-wrap gap-2", className)}>
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border bg-card px-4 py-2 text-sm ring-1 ring-primary/10"
          >
            {item}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/60 py-4 ring-1 ring-primary/10",
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-card to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card to-transparent"
        aria-hidden
      />
      <div
        className={cn(
          "flex w-max gap-3 px-4",
          !paused && "animate-[marquee_32s_linear_infinite]"
        )}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            tabIndex={i < items.length ? 0 : -1}
            className="shrink-0 rounded-full border bg-background px-4 py-2 text-sm whitespace-nowrap ring-1 ring-primary/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
