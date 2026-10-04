import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Photo a letter",
  description: "Turn a county or landlord letter into one task.",
}

export default function LettersPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Financials</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Photo a letter
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Open Financials and tap the Scanner tab. Take a photo of a letter, bill,
        or receipt with your camera, or upload one. You get one plain task (due
        date, what to send or bring), and the photo is thrown away. No document
        archive.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/financials?tab=scanner" className={cn(buttonVariants({ variant: "outline" }))}>
          Go to the Scanner
        </Link>
      </div>
    </Container>
  )
}
