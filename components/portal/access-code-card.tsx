"use client"

import * as React from "react"
import { toast } from "sonner"
import { IconCopy, IconRefresh } from "@tabler/icons-react"

import { rotateAccessCode } from "@/lib/portal/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function AccessCodeCard({
  orgId,
  initialCode,
}: {
  orgId: string
  initialCode: string
}) {
  const [code, setCode] = React.useState(initialCode)
  const [pending, setPending] = React.useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Access code copied.")
    } catch {
      toast.error("Could not copy. Select the code and copy manually.")
    }
  }

  async function onRotate() {
    if (
      !window.confirm(
        "Generate a new code? The old code will stop working for new join requests."
      )
    ) {
      return
    }

    setPending(true)
    try {
      const result = await rotateAccessCode(orgId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCode(result.code)
      toast.success("New access code ready.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access code</CardTitle>
        <CardDescription>
          Share this with staff who should join your organization. They still
          need your approval before they can edit the site.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={code}
          className="font-mono text-lg tracking-widest"
          aria-label="Organization access code"
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCopy}>
            <IconCopy />
            Copy
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={onRotate}>
            <IconRefresh />
            New code
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
