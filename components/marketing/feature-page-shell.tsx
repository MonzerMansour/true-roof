import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { MarketingHero } from "@/components/marketing/marketing-hero"
import { Reveal } from "@/components/marketing/reveal"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { features, type Feature } from "@/lib/features"

export function FeaturePageShell({ feature }: { feature: Feature }) {
  return (
    <>
      <MarketingHero
        photo={feature.photo}
        eyebrow={feature.eyebrow}
        title={feature.title}
        lede={feature.lede}
        compact
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

      <section className="border-b bg-primary/[0.03] py-16">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="grid gap-12">
            {feature.sections.map((section) => (
              <Reveal key={section.title}>
                <section className="max-w-2xl">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                  {section.bullets ? (
                    <ul className="mt-4 grid gap-2 text-sm leading-relaxed">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="rounded-xl border bg-card px-3 py-2 ring-1 ring-primary/10"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <aside className="h-fit rounded-2xl border bg-card p-4 ring-1 ring-primary/10 lg:sticky lg:top-24">
              <p className="text-sm font-medium">More from True Roof</p>
              <ul className="mt-3 grid gap-2">
                {features
                  .filter((item) => item.slug !== feature.slug)
                  .map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/features/${item.slug}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.title}
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
