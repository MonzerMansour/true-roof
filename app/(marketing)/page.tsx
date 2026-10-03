import Link from "next/link"

import { ChapterSplit } from "@/components/marketing/chapter-split"
import { Container } from "@/components/marketing/container"
import { ListingCard } from "@/components/marketing/listing-card"
import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { Reveal } from "@/components/marketing/reveal"
import { ScrollGallery } from "@/components/marketing/scroll-gallery"
import { ScrollHero } from "@/components/marketing/scroll-hero"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { features } from "@/lib/features"
import { getFeaturedListings } from "@/lib/listings/queries"
import { withReviewStats } from "@/lib/listings/reviews"
import { photos } from "@/lib/photos"

export const revalidate = 60

const storyBeats = [
  {
    when: "Oct 1",
    title: "Pay rent, $1,450",
    body: "To Westgate Property Management. Same date every month, already on the list.",
  },
  {
    when: "Oct 3",
    title: "A county letter",
    body: "She photographs it. “This is your CalFresh report form. Due Oct 20. Last 2 pay stubs. Already on your list.”",
  },
  {
    when: "Oct 20",
    title: "CalFresh report",
    body: "Drop off on Senter Rd or upload. True Roof already knew this from the start date she typed in April.",
  },
]

/**
 * Homepage photo map. Every src appears once on this page.
 * Avoids canyon/van and luxury-house shots.
 */
const heroSideImages = [
  { photo: photos.parking, position: "left" as const, span: 1 },
  { photo: photos.garage, position: "left" as const, span: 1 },
  { photo: photos.kitchen, position: "right" as const, span: 1 },
  { photo: photos.window, position: "right" as const, span: 1 },
]

const featureSlidePhotos = {
  matcher: photos.building,
  parking: photos.lotDusk,
  deadlines: photos.checklist,
  letters: photos.letterForm,
  savings: photos.savings,
  income: photos.paystub,
} as const

const featureSlides = (
  Object.keys(featureSlidePhotos) as Array<keyof typeof featureSlidePhotos>
).flatMap((slug) => {
  const feature = features.find((item) => item.slug === slug)
  if (!feature) return []
  return [
    {
      photo: featureSlidePhotos[slug],
      eyebrow: feature.eyebrow,
      title: feature.title,
      body: feature.lede,
      href: `/features/${feature.slug}`,
    },
  ]
})

export default async function HomePage() {
  const { listings } = await getFeaturedListings()
  const featured = await withReviewStats(listings)

  return (
    <>
      <ScrollHero centerPhoto={photos.heroPath} sideImages={heroSideImages} />

      <ChapterSplit
        title="Two jobs. One app."
        left={{
          photo: photos.hallway,
          badge: "1 · Tonight",
          heading: "A bed or a lot that actually fits",
          body: "Pets, ID, a partner, a curfew, a car or RV. Hard rules remove the wrong sites. Shelters and safe parking sit side by side.",
          href: "/places",
          cta: "See places near you",
        }}
        right={{
          photo: photos.calendar,
          badge: "2 · After you have keys",
          heading: "The year of bills that keeps the housing",
          body: "Rent, CalFresh, Medi-Cal, a photographed letter, and a cushion the size of a month of rent. This is financial stability. Not another search.",
          href: "/features/deadlines",
          cta: "See deadlines",
        }}
      />

      <ScrollGallery
        slides={featureSlides}
        label="Features that keep the keys"
      />

      <section className="border-y bg-primary/[0.04] py-20">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">Featured sites</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Real places in Santa Clara County
              </h2>
              <p className="mt-3 text-muted-foreground">
                Live from the inventory. People who stayed can leave a short
                review.
              </p>
            </div>
          </Reveal>
          {featured.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((listing) => (
                <Reveal key={listing.id}>
                  <ListingCard listing={listing} />
                </Reveal>
              ))}
            </div>
          ) : null}
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/places"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Browse every published site
            </Link>
            <Link
              href="/features"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              All features
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <Badge variant="outline">After you get housed</Badge>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Maria typed rent once. True Roof wrote the year.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Move-in on September 15. CalFresh, Medi-Cal, a voucher, $1,450
                due on the 1st. The rest (recerts, renewals, every rent date) is
                already there. Photograph a letter and the list updates in plain
                language.
              </p>
              <ol className="mt-8 grid gap-4">
                {storyBeats.map((beat) => (
                  <li key={beat.when} className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-medium text-primary">
                      {beat.when}
                    </p>
                    <p className="mt-1 font-medium">{beat.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {beat.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal>
            <div className="grid gap-3">
              <MarketingPhoto
                photo={photos.apartment}
                className="aspect-[4/5] rounded-2xl ring-1 ring-primary/15"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
              <div className="grid grid-cols-2 gap-3">
                <MarketingPhoto
                  photo={photos.rentCushion}
                  className="aspect-square rounded-2xl ring-1 ring-primary/15"
                  sizes="20vw"
                />
                <MarketingPhoto
                  photo={photos.planner}
                  className="aspect-square rounded-2xl ring-1 ring-primary/15"
                  sizes="20vw"
                />
              </div>
              <PhotoCredit photo={photos.apartment} />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="relative isolate overflow-hidden py-28">
        <MarketingPhoto
          photo={photos.nightCity}
          className="absolute inset-0"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-black/75 to-black/55" />
        <Container className="relative grid gap-8 text-white lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Built for the phone you have
              </h2>
              <p className="mt-4 max-w-lg text-white/85">
                Installable without an app store. Deadlines and savings work
                offline. Letters are read, then the photo is deleted. A hide
                gesture drops to a neutral screen. Crisis lines skip the data
                bundle.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/features/privacy"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  )}
                >
                  Cheap phone & privacy
                </Link>
                <Link
                  href="/features/quiet"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  )}
                >
                  Quiet mode
                </Link>
                <Link
                  href="/features/help"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  )}
                >
                  Get Help
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <ul className="grid gap-3 text-sm">
              {[
                "Large text, high contrast, screen reader, voice intake",
                "SMS when there is no data, including a borrowed phone",
                "PIN or biometric lock, auto-lock, export & delete",
                "Quiet mode after about six steady months, not forever nagging",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="border-t py-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <MarketingPhoto
                photo={photos.phone}
                className="h-56"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="space-y-3 p-6">
                <Badge variant="outline" className="w-fit">
                  Primary
                </Badge>
                <h3 className="font-heading text-2xl font-semibold">For you</h3>
                <p className="text-muted-foreground">
                  Need a bed, a lot that takes your van, or help staying in the
                  apartment you just got. Voice intake if reading is hard.
                </p>
                <SignInButton>Create a free account</SignInButton>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <MarketingPhoto
                photo={photos.staff}
                className="h-56"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="space-y-3 p-6">
                <Badge variant="secondary" className="w-fit">
                  Secondary
                </Badge>
                <h3 className="font-heading text-2xl font-semibold">
                  For shelters & lots
                </h3>
                <p className="text-muted-foreground">
                  Edit your own attributes. See interest in the site. A
                  dashboard, not another email thread.
                </p>
                <Link
                  href="/for-providers"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  See the provider page
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 text-primary-foreground sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              aria-hidden
            >
              <MarketingPhoto
                photo={photos.provider}
                className="absolute inset-0 h-full"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-primary/85" />
            </div>
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                  Start with a place tonight
                </h2>
                <p className="mt-2 max-w-lg text-primary-foreground/85">
                  Create an account. Shelter and parking staff can join from the
                  same door.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SignInButton>Get started</SignInButton>
                <Link
                  href="/features"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  )}
                >
                  See all features
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
