"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  stepsForTour,
  type TourAudience,
  type TourRole,
} from "@/lib/tours/steps"
import {
  TOUR_CHANGE_EVENT,
  loadTourProgress,
  migrateLegacyTourSeen,
  saveTourProgress,
  shouldOfferTour,
  type TourProgress,
} from "@/lib/tours/storage"
import { cn } from "cn"

/**
 * A step-by-step tour of the pages one role can reach, one step per page.
 *
 * Deliberately not a modal and deliberately not a spotlight over a target.
 * Someone opening this at night on a borrowed phone with a dying battery
 * should never have the thing they came for covered up or made unclickable.
 * So this is a panel at the bottom of the screen, the page behind it stays
 * live and scrollable, and there is no backdrop and no focus trap: Tab moves
 * out of the tour and into the page, which is the point.
 *
 * It sits at the bottom because every control in this app was moved under a
 * thumb in the one-handed pass, and a tour pinned to the top would be the one
 * thing someone has to stretch for.
 *
 * Accessibility, in order of how easily each one breaks:
 *
 * - `role="region"` with a label, not `role="dialog"`. A dialog implies the
 *   rest of the page is inert, and here it is not.
 * - The step heading is focused on each change, so a keyboard or screen
 *   reader user is moved to the new step instead of being left behind on a
 *   button that just navigated. Focus can leave freely afterwards.
 * - A polite live region carries "Step 3 of 7" and the title, so the change
 *   is announced even when focus has already moved into the page.
 * - Escape closes it from anywhere on the page.
 * - Nothing is positioned absolutely inside the card and nothing has a fixed
 *   height, so large text and high contrast both grow it rather than clipping
 *   it. It is a single column until 640px.
 */
export function GuidedTour({
  role,
  audience,
  className,
}: {
  role: TourRole
  audience: TourAudience
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  // null means "storage not read yet", which renders nothing. Without it the
  // tour flashes on screen for somebody who dismissed it weeks ago.
  const [progress, setProgress] = React.useState<TourProgress | null>(null)
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  // Set when this component is the reason the page changed. Focus is only
  // taken when the person pressed Next or Back, never when they navigated the
  // page themselves and the tour happens to be open.
  const movedByTour = React.useRef(false)

  const steps = React.useMemo(
    () => stepsForTour(role, audience),
    [role, audience]
  )

  React.useEffect(() => {
    const read = () => {
      const stored = loadTourProgress(role)
      // Somebody who dismissed the old single-card welcome is not new, so
      // they are not offered the seeker tour unasked either.
      if (role === "seeker" && migrateLegacyTourSeen() && !stored.dismissed) {
        const dismissed = { ...stored, dismissed: true }
        saveTourProgress(role, dismissed)
        setProgress(dismissed)
        return
      }
      setProgress(stored)
    }

    read()
    window.addEventListener(TOUR_CHANGE_EVENT, read)
    return () => window.removeEventListener(TOUR_CHANGE_EVENT, read)
  }, [role])

  const open = Boolean(progress && shouldOfferTour(progress) && steps.length > 0)

  // Clamped, because the stored index came from a step list that may have been
  // a different length: signing in adds steps, and a provider adding their
  // first site adds two.
  const index = Math.min(progress?.index ?? 0, Math.max(steps.length - 1, 0))
  const step = steps[index]

  const close = React.useCallback(
    (reason: "dismissed" | "completed") => {
      setProgress((current) => {
        const next = {
          index: current?.index ?? 0,
          dismissed: reason === "dismissed",
          completed: reason === "completed",
        }
        saveTourProgress(role, next)
        return next
      })
    },
    [role]
  )

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close("dismissed")
    }

    // On window, not on the card: the page behind stays usable, so Escape has
    // to work while focus is out there rather than only inside the tour.
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, close])

  // Moves to the step's page, then takes focus to the new heading. Both are
  // skipped when the step is about the page already on screen, so Next on
  // /places does not reload /places underneath the person.
  function go(nextIndex: number) {
    const target = steps[nextIndex]
    if (!target) return

    setProgress((current) => {
      const next = {
        index: nextIndex,
        dismissed: false,
        completed: current?.completed ?? false,
      }
      saveTourProgress(role, next)
      return next
    })

    movedByTour.current = true
    if (target.path !== pathname) router.push(target.path)
  }

  React.useEffect(() => {
    if (!open || !movedByTour.current) return
    movedByTour.current = false
    headingRef.current?.focus()
  }, [open, index, pathname])

  // Marks the document while the tour is up, so a page can stand its own
  // bottom-pinned controls down rather than have them sit under the panel.
  //
  // Lifting them clear was tried first and was worse: on a 375 by 812 phone
  // at the largest text size the panel is around 400px, and pushing a second
  // bar above it left a strip of the actual page visible between the two.
  React.useEffect(() => {
    const root = document.documentElement

    if (!open) {
      root.removeAttribute("data-tour-open")
      return
    }

    root.setAttribute("data-tour-open", "")
    return () => root.removeAttribute("data-tour-open")
  }, [open])

  if (!open || !step) return null

  const last = index === steps.length - 1

  return (
    <div
      className={cn(
        // Fixed, so the tour follows the person from page to page rather than
        // scrolling away mid-step. pb-safe keeps it off an iPhone home bar.
        "fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4",
        className
      )}
    >
      {/* Capped, because at the largest text size the uncapped card grew to
          seventy per cent of a phone screen. The prose scrolls inside; the
          step counter, the close button and the controls never do, so the way
          out is always on screen. */}
      <section
        role="region"
        aria-labelledby={`tour-${role}-heading`}
        className="mx-auto flex max-h-[50svh] max-w-2xl flex-col rounded-xl border bg-card p-4 shadow-lg sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-primary">
            Step {index + 1} of {steps.length}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-mt-1 -mr-1 shrink-0"
            aria-label="Close the tour. You can start it again from Settings."
            onClick={() => close("dismissed")}
          >
            <IconX />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <h2
            id={`tour-${role}-heading`}
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-heading text-lg font-semibold outline-none"
          >
            {step.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          {step.action ? (
            <p className="mt-2 text-sm font-medium">{step.action}</p>
          ) : null}
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-2 sm:flex-row">
          {/* The forward action is first in the DOM so it is the first thing
              reached by Tab and, in the one-column phone layout, the one
              nearest the thumb. */}
          <Button
            type="button"
            size="touch"
            className="w-full shrink-0 sm:w-auto sm:flex-none"
            onClick={() => (last ? close("completed") : go(index + 1))}
          >
            {last ? "Finish" : "Next"}
            {last ? null : <IconArrowRight />}
          </Button>
          {index > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="w-full shrink-0 sm:w-auto sm:flex-none"
              onClick={() => go(index - 1)}
            >
              <IconArrowLeft />
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="touch"
            className="w-full shrink-0 sm:ml-auto sm:w-auto sm:flex-none"
            onClick={() => close("dismissed")}
          >
            Skip the tour
          </Button>
        </div>

        {/* Announced even when focus has already moved out into the page. */}
        <p aria-live="polite" className="sr-only">
          {`Step ${index + 1} of ${steps.length}. ${step.title}.`}
        </p>
      </section>
    </div>
  )
}
