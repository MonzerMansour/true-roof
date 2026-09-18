import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { features } from "@/lib/features"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Matching, safe parking, deadlines, letters, savings, Get Help, income cliffs, privacy, and quiet mode.",
}

export default function FeaturesPage() {
  return (
    <Container className="py-16">
      <Badge variant="outline">All features</Badge>
      <h1 className="font-heading mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Short term is a bed. Long term is staying housed.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every tab below is a real part of True Roof. Start with finding a place.
        Everything after that is for after you have keys.
      </p>
      <div className="mt-6">
        <SignInButton>Get started</SignInButton>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link key={feature.slug} href={`/features/${feature.slug}`}>
            <Card className="h-full overflow-hidden transition-colors hover:bg-muted/40">
              <MarketingPhoto
                photo={feature.photo}
                className="h-44"
                sizes="(min-width: 1024px) 30vw, 100vw"
              />
              <CardHeader>
                <p className="text-xs font-medium text-primary">
                  {feature.eyebrow}
                </p>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.lede}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  )
}
