import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/marketing/container"
import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { MarketingHero } from "@/components/marketing/marketing-hero"
import { Reveal } from "@/components/marketing/reveal"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { photos } from "@/lib/photos"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function isSignedInProvider() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return false

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return profile?.role === "provider"
}

export const metadata: Metadata = {
  title: "For shelters and parking lots",
  description:
    "Edit your own listing. See who is looking at your site. A dashboard, not another form.",
}

const portalPoints = [
  {
    title: "Your site, your attributes",
    body: "Pets, ID, couples, curfew, intake window, max stay. Enums you pick, not a paragraph you type. New values get added to the shared list, not invented per site.",
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
  "City-sanctioned, org-run, or informally tolerated. Informal is opt-in with a disclaimer",
  "Application, waitlist, or walk-up. Availability reads as open, full, or a count",
]

export default async function ProvidersPage() {
  const signedInProvider = await isSignedInProvider()

  return (
    <>
      <MarketingHero
        photo={photos.provider}
        eyebrow="Secondary audience, still first-class software"
        title="A dashboard for the people who run the site"
        lede="True Roof’s main customer is the person looking for a place. You are who they match to. Update your own listing. See interest. Stop playing phone tag about whether a bed is open."
        actions={
          <>
            {signedInProvider ? (
              <Link
                href="/portal"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Open the portal
              </Link>
            ) : (
              <SignInButton>Sign in as staff</SignInButton>
            )}
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              I’m looking for a place
            </Link>
          </>
        }
      />

      <section className="bg-primary/[0.03] py-20">
        <Container>
          <Reveal>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              The provider portal is a real dashboard
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Not a Google Form. Not an inbox. Staff at the physical site edit
              the row that seekers see.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {portalPoints.map((point) => (
              <Reveal key={point.title}>
                <article className="h-full rounded-2xl border bg-card p-6 ring-1 ring-primary/10">
                  <h3 className="font-heading text-lg font-semibold">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground">
                    {point.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Safe parking lots are not an afterthought
              </h2>
              <p className="mt-3 text-muted-foreground">
                If someone sleeps in a vehicle, True Roof asks vehicle questions
                and puts your lot next to shelters in the same results. You get
                the same decay model underneath, with simpler public copy.
              </p>
              <ul className="mt-6 grid gap-2">
                {parkingPoints.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border bg-card px-3 py-2 text-sm ring-1 ring-primary/10"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <div>
              <MarketingPhoto
                photo={photos.garage}
                className="aspect-[4/3] rounded-2xl ring-1 ring-primary/15"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
              <div className="mt-2">
                <PhotoCredit photo={photos.garage} />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="relative isolate overflow-hidden py-20">
        <MarketingPhoto
          photo={photos.staff}
          className="absolute inset-0 opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        <Container className="relative grid gap-6 lg:grid-cols-3">
          <Reveal>
            <article className="overflow-hidden rounded-2xl border bg-card ring-1 ring-primary/10 lg:col-span-2">
              <MarketingPhoto
                photo={photos.staff}
                className="h-64"
                sizes="70vw"
              />
              <div className="space-y-3 p-6">
                <h3 className="font-heading text-xl font-semibold">
                  Freshness is your reputation
                </h3>
                <p className="text-base text-muted-foreground">
                  Seekers see Live, Recent, or Call first. One badge for the
                  whole listing. A conflicting report lowers confidence and
                  pings you to reconcile. True Roof does not blast you with
                  nudges unless things are extremely stale, or you asked for
                  them.
                </p>
              </div>
            </article>
          </Reveal>
          <Reveal>
            <article className="flex h-full flex-col justify-between rounded-2xl border bg-card p-6 ring-1 ring-primary/10">
              <div>
                <h3 className="font-heading text-xl font-semibold">
                  Here4You, portable later
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Each listing carries a referral pathway: walk-in, hotline
                  referral required, or other. That is how coordinated entry
                  actually works in California counties, without redesigning the
                  schema for the next county.
                </p>
              </div>
              <Link
                href="/features/matcher"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-6 w-fit"
                )}
              >
                How matching works
              </Link>
            </article>
          </Reveal>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <Reveal>
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
                    Claim your site
                  </h2>
                  <p className="mt-1 max-w-lg text-primary-foreground/85">
                    Same sign-in as seekers. Choose “I run a shelter or lot”
                    when you create the account.
                  </p>
                </div>
                {signedInProvider ? (
                  <Link
                    href="/portal"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    )}
                  >
                    Open the portal
                  </Link>
                ) : (
                  <SignInButton>Open the portal</SignInButton>
                )}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
