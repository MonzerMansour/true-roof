"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { deleteListing } from "@/lib/portal/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Removing a site for good.
 *
 * One button and one question, rather than a type-the-name gate. The people
 * using this run shelters, not servers, and making somebody transcribe a name
 * to prove they meant it mostly teaches them to transcribe names. What the
 * dialog does instead is say exactly what goes with the site, counted from
 * the real rows rather than described in general terms, because "this cannot
 * be undone" is not information and "four people asked about this site" is.
 *
 * Deliberately last on the page and quiet until pressed: a provider comes
 * here to edit opening hours far more often than to delete anything.
 */
export function DeleteSiteCard({
  listingId,
  listingName,
  requestCount,
  reviewCount,
  published,
}: {
  listingId: string
  listingName: string
  /** People waiting on this site right now. */
  requestCount: number
  /** Reviews other people wrote, which go too. */
  reviewCount: number
  published: boolean
}) {
  const router = useRouter()
  const [asking, setAsking] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const losses = [
    requestCount > 0
      ? `${requestCount} ${requestCount === 1 ? "person who asked" : "people who asked"} about it`
      : null,
    reviewCount > 0
      ? `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"} people wrote`
      : null,
  ].filter(Boolean) as string[]

  async function remove() {
    setPending(true)
    try {
      const result = await deleteListing(listingId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.name} is gone.`)
      router.push("/portal")
      router.refresh()
    } finally {
      setPending(false)
      setAsking(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="w-fit text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setAsking(true)}
        >
          <IconTrash />
          Delete this site
        </Button>
        <p className="text-sm text-muted-foreground">
          If the site has only closed for the season, unpublish it instead and
          it keeps everything.
        </p>
      </div>

      <Dialog open={asking} onOpenChange={setAsking}>
        <DialogContent className="max-h-[calc(100svh-1.5rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader className="min-w-0">
            <DialogTitle className="pr-12 leading-snug">
              Delete {listingName}?
            </DialogTitle>
            <DialogDescription className="text-base">
              {published
                ? "It comes off the Places list straight away, so nobody looking for a bed will see it again."
                : "It is a draft, so nobody looking for a bed can see it today."}
            </DialogDescription>
          </DialogHeader>

          {losses.length > 0 ? (
            <div className="min-w-0 text-sm">
              <p>This also removes:</p>
              <ul className="mt-2 list-disc pl-5">
                {losses.map((loss) => (
                  <li key={loss}>{loss}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground">
                None of it can be brought back.
              </p>
            </div>
          ) : (
            <p className="min-w-0 text-sm text-muted-foreground">
              Nothing else is attached to it. It cannot be brought back.
            </p>
          )}

          {/* Keep first, as on the sign-out dialog: being wrong towards
              keeping costs a second press, and being wrong the other way
              costs the site. */}
          <DialogFooter className="min-w-0 flex-col sm:flex-row">
            <Button
              type="button"
              size="touch"
              className="w-full min-w-0 sm:w-auto"
              disabled={pending}
              onClick={() => setAsking(false)}
            >
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="touch"
              className="w-full min-w-0 sm:w-auto"
              disabled={pending}
              onClick={() => void remove()}
            >
              {pending ? "Deleting…" : "Delete it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
