"use client"

import * as React from "react"

import { cn } from "cn"

const levels = [
  {
    id: "live" as const,
    label: "Live",
    helper: "Staff updated this recently. Seekers can trust the row.",
    chip: "bg-success/15 text-success-text ring-success/30",
    bar: "bg-success",
    width: "88%",
  },
  {
    id: "recent" as const,
    label: "Recent",
    helper: "Still useful, but confidence is starting to decay.",
    chip: "bg-warning/15 text-warning-text ring-warning/30",
    bar: "bg-warning",
    width: "55%",
  },
  {
    id: "call_first" as const,
    label: "Call first",
    helper: "Conflicting reports or staleness. Call before you go.",
    chip: "bg-destructive/15 text-destructive ring-destructive/30",
    bar: "bg-destructive",
    width: "28%",
  },
]

/** Interactive Live / Recent / Call first sample listing chip. */
export function FreshnessDemo({ className }: { className?: string }) {
  const [level, setLevel] = React.useState<(typeof levels)[number]["id"]>("live")
  const active = levels.find((l) => l.id === level) ?? levels[0]

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6 ring-1 ring-primary/10",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Tap a freshness badge. One signal for the whole listing.
      </p>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Freshness demo"
      >
        {levels.map((item) => {
          const selected = item.id === level
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setLevel(item.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? item.chip
                  : "bg-muted/50 text-muted-foreground ring-transparent hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <article className="mt-6 rounded-xl border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-lg font-semibold">
              River Lot Safe Parking
            </p>
            <p className="text-sm text-muted-foreground">Open · cars and RVs</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors duration-300",
              active.chip
            )}
          >
            {active.label}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              active.bar
            )}
            style={{ width: active.width }}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{active.helper}</p>
      </article>
    </div>
  )
}
