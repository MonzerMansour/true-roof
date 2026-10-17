"use client"

import * as React from "react"
import { IconCopy, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  createSiteTransferCode,
  revokeSiteTransferCode,
} from "@/lib/portal/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Hand this site to another organization.
 *
 * Directors only, and deliberately not next to the everyday fields: this is
 * the one control on the page whose effect the person pressing it cannot undo
 * on their own. Once the code is redeemed the site belongs to somebody else
 * and getting it back needs them to issue a code in return.
 *
 * The code is shown rather than emailed because these handovers happen in
 * phone calls between two people who already know each other, which is also
 * why it expires and why issuing a new one cancels the last.
 */
export function TransferSiteCard({
  listingId,
  listingName,
  initialCode,
}: {
  listingId: string
  listingName: string
  initialCode: { code: string; expiresAt: string } | null
}) {
  const [current, setCurrent] = React.useState(initialCode)
  const [pending, setPending] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  async function issue() {
    setPending(true)
    try {
      const result = await createSiteTransferCode(listingId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCurrent({ code: result.code, expiresAt: result.expiresAt })
      toast.success("Code ready. It works once, and only for this site.")
    } finally {
      setPending(false)
    }
  }

  async function cancel() {
    setPending(true)
    try {
      const result = await revokeSiteTransferCode(listingId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCurrent(null)
      toast.success("Code cancelled. It will not work for anyone now.")
    } finally {
      setPending(false)
    }
  }

  async function copy() {
    if (!current) return
    try {
      await navigator.clipboard.writeText(current.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked. The code is on screen either way.
      toast.message("Copy it from the screen.")
    }
  }

  const expires = current
    ? new Date(current.expiresAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
      })
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hand this site to another organization</CardTitle>
        <CardDescription className="text-base">
          If somebody else runs {listingName} now, give their director this
          code. When they enter it the site moves to them, keeping its saved
          places, requests and reviews, and your organization stops being able
          to edit it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {current ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-2xl font-semibold tracking-widest">
                {current.code}
              </p>
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => void copy()}
              >
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Works once, for this site only, until {expires}. Anyone who has it
              before then can take the site over, so send it to one person
              rather than a group.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="touch"
                disabled={pending}
                onClick={() => void issue()}
              >
                Replace this code
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="touch"
                disabled={pending}
                onClick={() => void cancel()}
              >
                Cancel this code
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="w-fit"
            disabled={pending}
            onClick={() => void issue()}
          >
            {pending ? "Making a code…" : "Make a transfer code"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
