"use client"

import * as React from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"

import { rotateListingAccessCode } from "@/lib/portal/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * The site's own code, for letting somebody else help run it.
 *
 * Sharing, not handing over: whoever uses the code can view and edit this
 * site and sees it on their dashboard, and this organization keeps it. That
 * distinction is the whole card, so the copy says it rather than leaving it
 * to be discovered.
 *
 * Only the organization that runs the site can change the code. A shared
 * editor can read it, so whoever is actually keeping the site current can
 * pass it to a colleague without going back through the owner, but they
 * cannot lock the owner's other people out.
 */
export function ShareSiteCard({
  listingId,
  listingName,
  initialCode,
  canRotate,
}: {
  listingId: string
  listingName: string
  initialCode: string | null
  canRotate: boolean
}) {
  const [code, setCode] = React.useState(initialCode)
  const [pending, setPending] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  async function rotate() {
    setPending(true)
    try {
      const result = await rotateListingAccessCode(listingId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCode(result.code)
      toast.success("New code. The old one has stopped working.")
    } finally {
      setPending(false)
    }
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.message("Copy it from the screen.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Let someone help run {listingName}</CardTitle>
        <CardDescription className="text-base">
          Give them this code. They will see this site on their own dashboard
          and can keep its details current. You keep the site: this shares it,
          it does not hand it over.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {code ? null : (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm">
              This site has no code yet. If you chose one when you created the
              site, it was not saved: the part of the database that stores
              codes has not been set up on this project.
            </p>
            {canRotate ? (
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="w-fit"
                disabled={pending}
                onClick={() => void rotate()}
              >
                {pending ? "Trying…" : "Make a code"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask the organization that runs this site to make one.
              </p>
            )}
          </div>
        )}

        {code ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-2xl font-semibold tracking-widest">
            {code}
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
        ) : null}

        {canRotate && code ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="w-fit"
              disabled={pending}
              onClick={() => void rotate()}
            >
              {pending ? "Making a new code…" : "Make a new code"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Use this if the code has gone further than you meant. Anyone
              already helping keeps their access; only the old code stops
              working.
            </p>
          </div>
        ) : code ? (
          <p className="text-sm text-muted-foreground">
            You can pass this code on. Only the organization that runs the site
            can change it.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
