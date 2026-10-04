"use client"

import { ThemeToggle } from "@/components/theme-toggle"

/** Fixed bottom-right theme control. Lives outside the header so the pill
 * stays clean and the toggle is always one reach away. */
export function ThemeCorner() {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 sm:right-5 sm:bottom-5">
      <div className="pointer-events-auto rounded-full bg-background/90 p-1 shadow-lg ring-1 ring-border/60 backdrop-blur-md">
        <ThemeToggle />
      </div>
    </div>
  )
}
