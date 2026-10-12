"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// A panel over the page: most of the screen, the page still visible around
// it, its own scroll, closed with the X or Escape.
export function PanelDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85dvh] grid-rows-[auto_minmax(0,1fr)] sm:max-w-[min(48rem,calc(100%-2rem))]">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

// "Show 80 more" opens the full list in a panel instead of stretching the
// page, so there is nothing to scroll back past.
export function ShowMoreDialog({
  label,
  title,
  children,
}: {
  label: string
  title: string
  // Gets a function that closes the panel, for rows that send the person
  // somewhere else on the page.
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <PanelDialog open={open} onOpenChange={setOpen} title={title}>
        {children(() => setOpen(false))}
      </PanelDialog>
    </>
  )
}
