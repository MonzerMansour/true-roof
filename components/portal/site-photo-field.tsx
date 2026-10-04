"use client"

import * as React from "react"
import { IconTrash, IconUpload } from "@tabler/icons-react"
import { toast } from "sonner"

import { PhotoCapture } from "@/components/dashboard/photo-capture"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// The site's own photo. Saved on its own, separate from the settings form,
// so a photo is never lost to an unsaved form or the other way round.
export function SitePhotoField({
  listingId,
  photoUrl: initialUrl,
}: {
  listingId: string
  photoUrl: string | null
}) {
  const [photoUrl, setPhotoUrl] = React.useState(initialUrl)
  const [pending, setPending] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function send(method: "POST" | "DELETE", image?: string) {
    setBusy(true)
    try {
      const response = await fetch(`/api/portal/sites/${listingId}/photo`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: image ? JSON.stringify({ image }) : undefined,
      })
      const body = (await response.json().catch(() => ({}))) as {
        photoUrl?: string | null
        error?: string
      }
      if (!response.ok) {
        toast.error(body.error ?? "Could not save the photo.")
        return
      }
      setPhotoUrl(body.photoUrl ?? null)
      setPending(null)
      toast.success(method === "POST" ? "Photo saved. It shows on this site's card and page." : "Photo removed.")
    } catch {
      toast.error("No connection. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const shown = pending ?? photoUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site photo</CardTitle>
        <CardDescription>
          A photo of the outside or the entrance helps people find you. It
          replaces the stock photo on this site&apos;s card, its page, and the
          homepage. Avoid photos where people can be recognized.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview or this site's own upload
          <img
            src={shown}
            alt={pending ? "The photo you picked, not saved yet" : "This site's current photo"}
            className="aspect-video w-full max-w-xl rounded-lg bg-muted object-cover"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No photo yet. People see a stock photo until you add one.
          </p>
        )}

        {pending ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => send("POST", pending)}>
              <IconUpload />
              {busy ? "Saving..." : "Save photo"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <PhotoCapture onPhoto={setPending} />
            {photoUrl ? (
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                disabled={busy}
                onClick={() => send("DELETE")}
              >
                <IconTrash />
                Remove photo
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
