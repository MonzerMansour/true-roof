"use client"

import * as React from "react"

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
 * The one question asked on the way out: leave this information on the phone,
 * or take it off.
 *
 * It exists because signing out used to leave somebody's rent, bills,
 * deadlines, saved places and answers sitting in the browser for whoever
 * picked the phone up next, and this app is explicitly used on borrowed
 * phones.
 *
 * Two rules it must not break:
 *
 * - Signing out always completes. Closing this with Escape, the X, or a click
 *   outside is a choice, not a cancel: it means keep, and the sign-out still
 *   goes through. There is no way to end up still signed in.
 * - Remove is never the quiet default. Keep is the primary button and the
 *   dismissal behaviour, because getting this wrong in the keep direction
 *   leaves data behind, and getting it wrong in the remove direction destroys
 *   a year of rent dates that exist nowhere else.
 *
 * Accessibility comes from the Dialog primitive: it is modal, which is right
 * here because this genuinely is a decision that blocks, unlike the guided
 * tour. The title and description are wired to the dialog by id, so both are
 * read on open. Nothing is absolutely positioned and no height is fixed, so
 * large text and high contrast grow the dialog instead of clipping it, and
 * the buttons stack into one column below 640px.
 */
export function SignOutDialog({
  open,
  onKeep,
  onRemove,
}: {
  open: boolean
  /** Dismissed, or chose to keep. Either way, sign out. */
  onKeep: () => void
  onRemove: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only the close direction is meaningful: the dialog is opened by
        // signOut(), never by a trigger in here.
        if (!next) onKeep()
      }}
    >
      {/* min-w-0 on the grid items: DialogContent is a grid, whose items
          default to min-width auto and are therefore sized by their content.
          At the largest text size the footer buttons' own width pushed the
          title's box past the right edge of the dialog and clipped it.

          The height cap and scroll are the other half of the same problem.
          The primitive centres the dialog with -translate-y-1/2, so at the
          largest text size it grew past both ends of a 375 by 812 screen and
          cut the title off at the top with no way to reach it. */}
      <DialogContent
        className="max-h-[calc(100svh-1.5rem)] overflow-y-auto sm:max-w-md"
        showCloseButton
      >
        <DialogHeader className="min-w-0">
          {/* Clears the close button, which is absolutely positioned at top
              right and which a three-line title ran straight into. pr-12
              rather than pr-8 because the button scales with the text size
              too, so the gap has to be measured at the largest one.
              leading-snug because the primitive sets leading-none, which
              collides the lines of a title that wraps. */}
          <DialogTitle className="pr-12 leading-snug">
            Before you sign out, what about the information on this phone?
          </DialogTitle>
          <DialogDescription className="text-base">
            Your answers about pets, ID, a partner and a car are saved to your
            account as well, so removing them here loses nothing. You get them
            back next time you sign in.
          </DialogDescription>
        </DialogHeader>

        <p className="min-w-0 text-sm">
          Your rent, bills and deadlines are only on this phone. Nothing is
          saved to your account and nothing is sent anywhere, so removing them
          cannot be undone.
        </p>

        {/* flex-col, not the primitive's flex-col-reverse: reversed, the
            destructive choice was the first thing read on a phone. Reading
            order matches DOM order here, so Keep comes first. */}
        <DialogFooter className="min-w-0 flex-col sm:flex-row">
          <Button
            type="button"
            size="touch"
            className="w-full min-w-0 sm:w-auto"
            onClick={onKeep}
          >
            Keep it on this phone
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="touch"
            className="w-full min-w-0 sm:w-auto"
            onClick={onRemove}
          >
            Remove it from this phone
          </Button>
        </DialogFooter>

        <p className="min-w-0 text-sm text-muted-foreground">
          Closing this keeps it. Either way, you are signed out.
        </p>
      </DialogContent>
    </Dialog>
  )
}
