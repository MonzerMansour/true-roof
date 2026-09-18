import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { MarketingPhoto, PhotoCredit } from "@/components/marketing/marketing-photo"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { features, type Feature } from "@/lib/features"

export function FeaturePageShell({ feature }: { feature: Feature }) {
  return (
    <>
      <section className="relative isolate min-h-[22rem] overflow-hidden sm:min-h-[28rem]">
        <MarketingPhoto
          photo={feature.photo}
          priority
          sizes="100vw"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
        <Container className="relative flex min-h-[22rem] flex-col justify-end pb-10 pt-24 text-white sm:min-h-[28rem]">
          <Badge variant="secondary" className="w-fit bg-white/15 text-white">
            {feature.eyebrow}
          </Badge>
          <h1 className="font-heading mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {feature.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 text-pretty sm:text-lg">
            {feature.lede}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
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
          </div>
          <PhotoCredit photo={feature.photo} className="text-white/60" />
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid gap-12">
          {feature.sections.map((section) => (
            <section key={section.title} className="max-w-2xl">
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
                      className="rounded-lg border bg-card px-3 py-2"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-xl border bg-card p-4 lg:sticky lg:top-20">
          <p className="text-sm font-medium">More from True Roof</p>
          <ul className="mt-3 grid gap-2">
            {features
              .filter((item) => item.slug !== feature.slug)
              .map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/features/${item.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
          </ul>
        </aside>
      </Container>
    </>
  )
}
