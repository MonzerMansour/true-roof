import Link from "next/link"

import { Container } from "@/components/marketing/container"
import { ListingCard } from "@/components/marketing/listing-card"
import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "cn"
import { features } from "@/lib/features"
import { getFeaturedListings } from "@/lib/listings/queries"
import { photos } from "@/lib/photos"
import { site } from "@/lib/site"

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

const findFeatures = features.filter((feature) =>
  ["matcher", "parking"].includes(feature.slug)
)
const stayFeatures = features.filter(
  (feature) => !["matcher", "parking"].includes(feature.slug)
)

export default async function HomePage() {
  const { listings } = await getFeaturedListings()
  const heroListings = listings.slice(0, 3)

  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-3.5rem)] overflow-hidden">
        <MarketingPhoto
          photo={photos.keys}
          priority
          sizes="100vw"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
        <Container className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-end gap-8 pb-12 pt-24 text-white lg:justify-center">
          <div>
            <p className="text-sm font-medium tracking-wide text-white/80">
              For people looking for a place tonight
            </p>
            <h1 className="font-heading mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {site.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85 text-pretty">
              First we match you to a shelter or a safe parking lot using real
              constraints. Then we help you keep the rent, the paperwork, and
              the cushion that keep the keys.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
              <SignInButton>Find a place</SignInButton>
              <Link
                href="/for-providers"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                )}
              >
                I run a shelter or lot
              </Link>
            </div>
          </div>

          {heroListings.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {heroListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  variant="onDark"
                />
              ))}
            </div>
          ) : null}
          <PhotoCredit photo={photos.keys} className="text-white/55" />
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <p className="text-sm font-medium text-primary">Two jobs. One app.</p>
          <h2 className="font-heading mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Get through tonight. Then stay housed.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            True Roof is not a directory with a calendar bolted on. It is two
            distinct kinds of help, in order.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <MarketingPhoto
                photo={photos.parking}
                className="h-52"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <CardHeader>
                <Badge className="w-fit">1 · Tonight</Badge>
                <CardTitle className="text-2xl">
                  A bed or a lot that actually fits
                </CardTitle>
                <CardDescription className="text-base">
                  Pets, ID, a partner, a curfew, a car or RV. Hard rules remove
                  the wrong sites. What remains sits side by side: shelters and
                  safe parking, scored Live / Recent / Call first.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pb-6">
                {findFeatures.map((feature) => (
                  <Link
                    key={feature.slug}
                    href={`/features/${feature.slug}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    {feature.slug === "parking" ? "Safe parking" : "Find a place"}
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <MarketingPhoto
                photo={photos.calendar}
                className="h-52"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  2 · After you have keys
                </Badge>
                <CardTitle className="text-2xl">
                  The year of bills that keeps the housing
                </CardTitle>
                <CardDescription className="text-base">
                  Rent, CalFresh, Medi-Cal, a photographed letter, a cushion
                  the size of a month of rent, and a warning before a 3-day
                  notice becomes a lockout. This is financial stability — not
                  another search.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pb-6">
                <Link
                  href="/features/deadlines"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Deadlines
                </Link>
                <Link
                  href="/features/savings"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Rent cushion
                </Link>
                <Link
                  href="/features/income"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Job & benefits
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className="bg-muted/40 py-20">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything it does
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Search first. Stability second. Same account.
              </p>
            </div>
            <Link
              href="/features"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Browse features
            </Link>
          </div>

          <p className="mt-10 text-sm font-medium text-muted-foreground">
            Tonight
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {findFeatures.map((feature) => (
              <FeatureTile key={feature.slug} feature={feature} />
            ))}
          </div>

          <p className="mt-12 text-sm font-medium text-muted-foreground">
            After you get housed
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stayFeatures.map((feature) => (
              <FeatureTile key={feature.slug} feature={feature} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="outline">After you get housed</Badge>
            <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Maria typed rent once. True Roof wrote the year.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Move-in on September 15. CalFresh, Medi-Cal, a voucher, $1,450 due
              on the 1st. The rest — recerts, renewals, every rent date — is
              already there. Photograph a letter and the list updates in plain
              language.
            </p>
            <ol className="mt-8 grid gap-4">
              {storyBeats.map((beat) => (
                <li key={beat.when} className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium text-primary">{beat.when}</p>
                  <p className="mt-1 font-medium">{beat.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {beat.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <MarketingPhoto
              photo={photos.apartment}
              className="aspect-[4/5] rounded-xl"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="mt-2">
              <PhotoCredit photo={photos.apartment} />
            </div>
          </div>
        </Container>
      </section>

      <section className="relative isolate overflow-hidden py-24">
        <MarketingPhoto
          photo={photos.nightCity}
          className="absolute inset-0"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" />
        <Container className="relative grid gap-8 text-white lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for the phone you have
            </h2>
            <p className="mt-4 max-w-lg text-white/80">
              Installable without an app store. Deadlines and savings work
              offline. Letters are read, then the photo is deleted. A hide
              gesture drops to a neutral screen. Crisis lines skip the data
              bundle.
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              "Large text, high contrast, screen reader, voice intake",
              "SMS when there is no data, including a borrowed phone",
              "PIN or biometric lock, auto-lock, export & delete",
              "Quiet mode after about six steady months — not forever nagging",
            ].map((item) => (
              <li
                key={item}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t py-20">
        <Container className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden">
            <MarketingPhoto
              photo={photos.window}
              className="h-56"
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Primary
              </Badge>
              <CardTitle className="text-2xl">For you</CardTitle>
              <CardDescription className="text-base">
                Need a bed, a lot that takes your van, or help staying in the
                apartment you just got. Voice intake if reading is hard. Works
                on a cheap phone.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <SignInButton>Create a free account</SignInButton>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <MarketingPhoto
              photo={photos.staff}
              className="h-56"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Secondary
              </Badge>
              <CardTitle className="text-2xl">For shelters & lots</CardTitle>
              <CardDescription className="text-base">
                Edit your own attributes. See interest in the site. A dashboard,
                not another email thread.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Link
                href="/for-providers"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                See the provider page
              </Link>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="pb-16">
        <Container className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Start with a place tonight
            </h2>
            <p className="mt-1 text-muted-foreground">
              Create an account. Shelter and parking staff can join from the
              same door.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignInButton>Get started</SignInButton>
            <Link
              href="/features"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See all features
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}

function FeatureTile({
  feature,
}: {
  feature: (typeof features)[number]
}) {
  return (
    <Link href={`/features/${feature.slug}`}>
      <Card className="h-full overflow-hidden transition-colors hover:bg-muted/40">
        <MarketingPhoto
          photo={feature.photo}
          className="h-44"
          sizes="(min-width: 1024px) 30vw, 100vw"
        />
        <CardHeader>
          <CardTitle>{feature.title}</CardTitle>
          <CardDescription>{feature.lede}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
