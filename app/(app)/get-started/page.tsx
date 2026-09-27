import type { Metadata } from "next"

import { NeedChoices } from "@/components/app/need-choices"
import { Container } from "@/components/marketing/container"

export const metadata: Metadata = {
  title: "What do you need",
  description: "Looking for shelter tonight, or help staying housed?",
}

export default function GetStartedPage() {
  return (
    <Container className="py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">Welcome</p>
      <h1 className="font-heading mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        What do you need right now?
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Pick one.</p>

      <div className="mt-8">
        <NeedChoices />
      </div>
    </Container>
  )
}
