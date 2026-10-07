"use client"

import * as React from "react"
import Link from "next/link"
import { IconX } from "@tabler/icons-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

const SEEN_KEY = "true-roof:tour-seen:v1"

/**
 * A short welcome on the first visit. Both ways in, then it gets out of the way.
 *
 * Deliberately not a step-by-step walkthrough with a backdrop and a highlighted
 * target. Someone opening this at night with a dying battery does not want to
 * be taught an interface; they want a bed. So this is one dismissible card that
 * names the two paths and never covers anything.
 *
 * It renders nothing at all until the browser confirms it has not been seen,
 * so it cannot flash on a returning visit. Dismissing it, or taking either
 * path, means it never appears again on this phone. No account, and nothing
 * leaves the device.
 */
export function FirstVisitTour() {
  // null means "not known yet", which renders nothing. Avoids a flash of the
  // tour for someone who dismissed it weeks ago.
  const [show, setShow] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    try {
      setShow(window.localStorage.getItem(SEEN_KEY) !== "1")
    } catch {
      // Storage blocked. Showing it once per session is better than a person
      // never learning there are two ways in.
      setShow(true)
    }
  }, [])

  function dismiss() {
    setShow(false)
    try {
      window.localStorage.setItem(SEEN_KEY, "1")
    } catch {
      // Nothing to do. It reappears next session, which is survivable.
    }
  }

  if (!show) return null

  return (
    <section
      aria-labelledby="tour-heading"
      className="relative rounded-xl border bg-card p-5"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3"
        aria-label="Dismiss this welcome message"
        onClick={dismiss}
      >
        <IconX />
      </Button>

      <h2
        id="tour-heading"
        className="pr-10 font-heading text-lg font-semibold"
      >
        Two ways to use this
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No account needed for either one, and nothing you enter leaves this
        phone unless you ask it to.
      </p>

      <ol className="mt-4 grid gap-3">
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
          >
            1
          </span>
          <span className="text-sm">
            <strong className="font-medium">Just look.</strong> Every shelter
            and safe parking lot we know about, with a number to call.
          </span>
        </li>
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
          >
            2
          </span>
          <span className="text-sm">
            <strong className="font-medium">Answer a few questions</strong>{" "}
            about pets, ID, a partner, or a car, and the list drops the places
            that cannot take you. About a minute, and you can speak the answers
            instead of typing.
          </span>
        </li>
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/places"
          onClick={dismiss}
          className={cn(buttonVariants({ size: "touch" }))}
        >
          Just look
        </Link>
        <Link
          href="/get-started/find-a-place"
          onClick={dismiss}
          className={cn(buttonVariants({ variant: "outline", size: "touch" }))}
        >
          Answer the questions
        </Link>
      </div>
    </section>
  )
}
