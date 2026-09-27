import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Photo a letter",
  description: "Turn a county or landlord letter into one task.",
}

export default function LettersStubPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Financials</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Photo a letter
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Not built yet. When it is live, you will photograph a letter, see one
        plain-language task (due date, who to call, what to bring), and the
        photo will be discarded. No document archive.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/financials" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Financials
        </Link>
      </div>
    </Container>
  )
}
