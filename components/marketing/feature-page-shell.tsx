import Link from "next/link"

import { FeatureDetailHero } from "@/components/marketing/feature-detail-hero"
import { PortalTimeline } from "@/components/marketing/portal-timeline"
import { Reveal } from "@/components/marketing/reveal"
import { Container } from "@/components/marketing/container"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { features, type Feature } from "@/lib/features"

export function FeaturePageShell({ feature }: { feature: Feature }) {
  const chips =
    feature.sections.find((section) => section.bullets?.length)?.bullets ??
    feature.sections.slice(0, 3).map((section) => section.title)

  const timelineSteps = feature.sections.map((section) => ({
    title: section.title,
    body: section.bullets?.length
      ? `${section.body} ${section.bullets.join(" · ")}`
      : section.body,
  }))

  return (
    <>
      <FeatureDetailHero
        photo={feature.photo}
        eyebrow={feature.eyebrow}
        title={feature.title}
        lede={feature.lede}
        chips={chips}
        actions={
          <>
            <SignInButton>Get started</SignInButton>
            <Link
              href="/features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              All features
            </Link>
          </>
        }
      />

      <PortalTimeline
        heading="How this part works"
        lede="Scroll through each piece. Same facts as before, shown as a path instead of a long wall of text."
        steps={timelineSteps}
      />

      <section className="border-t py-16">
        <Container>
          <Reveal>
            <aside className="rounded-2xl border bg-card p-5 ring-1 ring-primary/10">
              <p className="text-sm font-medium">More from True Roof</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {features
                  .filter((item) => item.slug !== feature.slug)
                  .map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/features/${item.slug}`}
                        className="block rounded-xl border px-3 py-3 text-sm transition-all hover:border-primary/30 hover:bg-muted/40"
                      >
                        <span className="font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-muted-foreground">
                          {item.eyebrow}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </aside>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
