import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
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
import { photos } from "@/lib/photos"

export const metadata: Metadata = {
  title: "For shelters and parking lots",
  description:
    "Edit your own listing. See who is looking at your site. A dashboard, not another form.",
}

const portalPoints = [
  {
    title: "Your site, your attributes",
    body: "Pets, ID, couples, curfew, intake window, max stay. Enums you pick — not a paragraph you type. New values get added to the shared list, not invented per site.",
  },
  {
    title: "One row per address",
    body: "If you run three buildings, you get three listings under one org. Staff at the site can edit. True Roof’s team can too. A direct contact line covers what the portal does not.",
  },
  {
    title: "Interest, not a voicemail pile",
    body: "See who is looking at your site. Auto-nudges only fire for extreme staleness, or if you opt in. Not every morning.",
  },
  {
    title: "Reviews with recourse",
    body: "People who stayed can comment, with a report flag. You can also be reviewed as a customer of the listing, so a bad-faith rating war has somewhere to go.",
  },
]

const parkingPoints = [
  "Hours, vehicle type, max size, bathrooms, security, consecutive nights, waitlist",
  "City-sanctioned, org-run, or informally tolerated — informal is opt-in with a disclaimer",
  "Application, waitlist, or walk-up. Availability reads as open, full, or a count",
]

export default function ProvidersPage() {
  return (
    <>
      <section className="relative isolate min-h-[24rem] overflow-hidden sm:min-h-[32rem]">
        <MarketingPhoto
          photo={photos.provider}
          priority
          sizes="100vw"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/20" />
        <Container className="relative flex min-h-[24rem] flex-col justify-end pb-12 pt-24 text-white sm:min-h-[32rem]">
          <Badge variant="secondary" className="w-fit bg-white/15 text-white">
            Secondary audience — still first-class software
          </Badge>
          <h1 className="font-heading mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            A dashboard for the people who run the site
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            True Roof’s main customer is the person looking for a place. You are who
            they match to. Update your own listing. See interest. Stop playing
            phone tag about whether a bed is open.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <SignInButton>Sign in as staff</SignInButton>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              I’m looking for a place
            </Link>
          </div>
          <PhotoCredit photo={photos.provider} className="text-white/55" />
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            The provider portal is a real dashboard
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Not a Google Form. Not an inbox. Staff at the physical site edit the
            row that seekers see.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {portalPoints.map((point) => (
              <Card key={point.title}>
                <CardHeader>
                  <CardTitle>{point.title}</CardTitle>
                  <CardDescription className="text-base">
                    {point.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-muted/40 py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Safe parking lots are not an afterthought
            </h2>
            <p className="mt-3 text-muted-foreground">
              If someone sleeps in a vehicle, True Roof asks vehicle questions and
              puts your lot next to shelters in the same results. You get the
              same decay model underneath, with simpler public copy.
            </p>
            <ul className="mt-6 grid gap-2">
              {parkingPoints.map((item) => (
                <li key={item} className="rounded-lg border bg-card px-3 py-2 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <MarketingPhoto
              photo={photos.garage}
              className="aspect-[4/3] rounded-xl"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="mt-2">
              <PhotoCredit photo={photos.garage} />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 overflow-hidden">
            <MarketingPhoto photo={photos.staff} className="h-64" sizes="70vw" />
            <CardHeader>
              <CardTitle>Freshness is your reputation</CardTitle>
              <CardDescription className="text-base">
                Seekers see Live, Recent, or Call first — one badge for the
                whole listing. A conflicting report lowers confidence and pings
                you to reconcile. True Roof does not blast you with nudges unless
                things are extremely stale, or you asked for them.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Here4You, portable later</CardTitle>
              <CardDescription className="text-base">
                Each listing carries a referral pathway: walk-in, hotline
                referral required, or other. That is how coordinated entry
                actually works in California counties, without redesigning the
                schema for the next county.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/features/matcher"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                How matching works
              </Link>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="pb-20">
        <Container className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Claim your site
            </h2>
            <p className="mt-1 text-muted-foreground">
              Same sign-in as seekers. Choose “I run a shelter or lot” when you
              create the account.
            </p>
          </div>
          <SignInButton>Open the portal</SignInButton>
        </Container>
      </section>
    </>
  )
}
