import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export default function NotFound() {
  return (
    <Container className="py-24">
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        That page is not here. Start from home, or look at what True Roof does.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className={cn(buttonVariants())}>
          Home
        </Link>
        <Link href="/features" className={cn(buttonVariants({ variant: "outline" }))}>
          Features
        </Link>
      </div>
    </Container>
  )
}
