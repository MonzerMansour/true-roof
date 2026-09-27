"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import { useSession } from "@/components/auth/session-provider"
import { useSignIn } from "@/components/auth/sign-in-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import {
  cancelInterest,
  loadMyInterest,
  submitInterest,
} from "@/lib/listings/interest-actions"
import { mapsUrl } from "@/lib/listings/geo"
import { contactForListing } from "@/lib/listings/contacts"
import {
  formatPhone,
  intakeActionLabel,
  intakeLabel,
  type InterestKind,
  type Listing,
} from "@/lib/listings/types"

export function PlaceIntake({
  listing,
  intent,
}: {
  listing: Listing
  intent?: string | null
}) {
  const pathname = usePathname()
  const { session } = useSession()
  const { openSignIn } = useSignIn()
  const contact = contactForListing(listing)
  const [active, setActive] = React.useState<InterestKind[]>([])
  const [pending, setPending] = React.useState(false)

  const refresh = React.useCallback(async () => {
    const rows = await loadMyInterest(listing.id)
    setActive(rows.map((row) => row.kind))
  }, [listing.id])

  React.useEffect(() => {
    void refresh()
  }, [refresh, session?.id])

  React.useEffect(() => {
    if (!session || !intent) return
    if (intent === "waitlist" || intent === "register" || intent === "on_the_way") {
      void onAsk(intent)
    }
    // Run once after sign-in lands with ?intent=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, intent])

  function needAccount(kind: InterestKind) {
    const next = `${pathname}?intent=${kind}`
    openSignIn({ next })
  }

  async function onAsk(kind: InterestKind) {
    if (!session) {
      needAccount(kind)
      return
    }

    setPending(true)
    try {
      const result = await submitInterest(listing.id, kind)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      await refresh()
      if (kind === "waitlist") {
        toast.success("You are on the waitlist. This is not a bed yet.")
      } else if (kind === "on_the_way") {
        toast.success("Staff can see you are on the way.")
      } else {
        toast.success("Your ask is in. This is not an approval.")
      }
    } finally {
      setPending(false)
    }
  }

  async function onWithdraw(kind: InterestKind) {
    setPending(true)
    try {
      const result = await cancelInterest(listing.id, kind)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      await refresh()
      toast.success("Removed.")
    } finally {
      setPending(false)
    }
  }

  const maps =
    listing.lat != null && listing.lng != null
      ? mapsUrl({ lat: listing.lat, lng: listing.lng }, listing.name)
      : null

  return (
    <div className="mt-6 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">{intakeLabel[listing.intakeMethod]}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {listing.intakeMethod === "call"
          ? "This site takes people by phone. Tap Call and your phone will offer to dial."
          : listing.intakeMethod === "waitlist"
            ? "This site is not taking walk-ins. Sign in to join the waitlist."
            : listing.intakeMethod === "walk_up"
              ? "Go in person during intake. You can tell them you are on the way."
              : "You can ask from here. Staff see it. That is not a yes."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {listing.intakeMethod === "call" && contact ? (
          <a href={`tel:${contact.tel}`} className={cn(buttonVariants({ size: "lg" }))}>
            Call {contact.label}
          </a>
        ) : null}

        {listing.intakeMethod === "waitlist" ? (
          active.includes("waitlist") ? (
            <Button
              size="lg"
              variant="outline"
              disabled={pending}
              onClick={() => void onWithdraw("waitlist")}
            >
              Leave waitlist
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => void onAsk("waitlist")}
            >
              {intakeActionLabel(listing)}
            </Button>
          )
        ) : null}

        {listing.intakeMethod === "register" ? (
          active.includes("register") ? (
            <Button
              size="lg"
              variant="outline"
              disabled={pending}
              onClick={() => void onWithdraw("register")}
            >
              Withdraw ask
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => void onAsk("register")}
            >
              {intakeActionLabel(listing)}
            </Button>
          )
        ) : null}

        {listing.intakeMethod === "walk_up" ? (
          active.includes("on_the_way") ? (
            <Button
              size="lg"
              variant="outline"
              disabled={pending}
              onClick={() => void onWithdraw("on_the_way")}
            >
              Cancel on the way
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => void onAsk("on_the_way")}
            >
              I am on my way
            </Button>
          )
        ) : null}

        {listing.intakeMethod !== "call" && contact ? (
          <a
            href={`tel:${contact.tel}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Call {formatPhone(contact.tel)}
          </a>
        ) : null}

        {maps ? (
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Directions
          </a>
        ) : null}
      </div>
    </div>
  )
}
