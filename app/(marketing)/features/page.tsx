import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import { Reveal } from "@/components/marketing/reveal"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { Badge } from "@/components/ui/badge"
import { features } from "@/lib/features"
import { photos } from "@/lib/photos"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Matching, safe parking, deadlines, letters, savings, Get Help, income cliffs, privacy, and quiet mode.",
}

export default function FeaturesPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <MarketingPhoto
          photo={photos.building}
          priority
          sizes="100vw"
          className="absolute inset-0 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/85 to-background" />
        <Container className="relative pt-28 pb-16">
          <Reveal>
            <Badge variant="outline">All features</Badge>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Short term is a bed. Long term is staying housed.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Every tab below is a real part of True Roof. Start with finding a
              place. Everything after that is for after you have keys.
            </p>
            <div className="mt-6">
              <SignInButton>Get started</SignInButton>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="border-t bg-primary/[0.03] py-16">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Reveal key={feature.slug}>
                <Link href={`/features/${feature.slug}`} className="block h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card ring-1 ring-primary/10 transition-colors hover:bg-muted/40">
                    <MarketingPhoto
                      photo={feature.photo}
                      className="h-44"
                      sizes="(min-width: 1024px) 30vw, 100vw"
                    />
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="text-xs font-medium text-primary">
                        {feature.eyebrow}
                      </p>
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        {feature.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {feature.lede}
                      </p>
                    </div>
                  </article>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
