"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconCalendarDue,
  IconHeart,
  IconHistory,
  IconMapPin,
  IconPhoneCall,
  IconWallet,
} from "@tabler/icons-react"

import { useSession } from "@/components/auth/session-provider"
import { NeedChoices } from "@/components/app/need-choices"
import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import {
  loadFavorites,
  loadRecentPlaces,
  subscribeActivity,
  type RecentPlace,
} from "@/lib/listings/activity"
import { loadMyInterests } from "@/lib/listings/interest-actions"
import type { InterestRow } from "@/lib/listings/interest"
import { photoForListing } from "@/lib/listings/photos"
import { interestLabel, type Listing } from "@/lib/listings/types"
import { loadNeeds } from "@/lib/matching/storage"
import { assessRisk, buildSchedule } from "@/lib/obligations/schedule"
import {
  loadCompletedOccurrenceIds,
  loadProfile,
} from "@/lib/obligations/storage"
import type { SeekerNeeds } from "@/lib/matching/needs"
import type { ObligationsProfile, Occurrence } from "@/lib/obligations/types"

const riskCopy = {
  steady: {
    label: "Steady",
    tone: "text-success-text",
    bar: "bg-success",
  },
  watch: {
    label: "Due soon",
    tone: "text-warning-text",
    bar: "bg-warning",
  },
  act: {
    label: "Needs action",
    tone: "text-destructive",
    bar: "bg-destructive",
  },
} as const

function firstNameFromEmail(email: string | null | undefined) {
  if (!email) return null
  const local = email.split("@")[0] ?? ""
  const token = local.split(/[._-]/)[0] ?? ""
  if (!token) return null
  return token.charAt(0).toUpperCase() + token.slice(1)
}

function formatShortDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function SeekerDashboard({ listings }: { listings: Listing[] }) {
  const { session } = useSession()
  const [favorites, setFavorites] = React.useState<string[]>([])
  const [recent, setRecent] = React.useState<RecentPlace[]>([])
  const [asks, setAsks] = React.useState<InterestRow[]>([])
  const [needs, setNeeds] = React.useState<SeekerNeeds | null>(null)
  const [profile, setProfile] = React.useState<ObligationsProfile | null>(null)
  const [upcoming, setUpcoming] = React.useState<Occurrence[]>([])
  const [completedIds, setCompletedIds] = React.useState<string[]>([])
  const [ready, setReady] = React.useState(false)

  const refreshLocal = React.useCallback(() => {
    setFavorites(loadFavorites())
    setRecent(loadRecentPlaces())
    setNeeds(loadNeeds())
    const plan = loadProfile()
    setProfile(plan)
    const completed = loadCompletedOccurrenceIds()
    setCompletedIds(completed)
    if (plan) {
      setUpcoming(
        buildSchedule(plan, completed).upcoming.slice(0, 6)
      )
    } else {
      setUpcoming([])
    }
  }, [])

  React.useEffect(() => {
    refreshLocal()
    setReady(true)
    return subscribeActivity(refreshLocal)
  }, [refreshLocal])

  React.useEffect(() => {
    void loadMyInterests().then(setAsks)
  }, [])

  if (!ready) return null

  const favoriteListings = favorites
    .map((id) => listings.find((item) => item.id === id))
    .filter((item): item is Listing => Boolean(item))

  const risk = profile
    ? assessRisk(buildSchedule(profile, completedIds).upcoming, completedIds, profile)
    : null
  const riskUi = risk ? riskCopy[risk.level] : null
  const nextDue = upcoming[0] ?? null
  const name = firstNameFromEmail(session?.email)
  const cushionPct =
    profile && profile.savingsGoal > 0
      ? Math.min(
          100,
          Math.round((profile.savingsSaved / profile.savingsGoal) * 100)
        )
      : 0

  const empty =
    favoriteListings.length === 0 &&
    recent.length === 0 &&
    upcoming.length === 0 &&
    asks.length === 0 &&
    !needs &&
    !profile

  const heroLine = nextDue
    ? `${nextDue.title} by ${formatShortDate(nextDue.date)}`
    : asks.length > 0
      ? `${asks.length} open ask${asks.length === 1 ? "" : "s"} with sites`
      : favoriteListings.length > 0
        ? `${favoriteListings.length} saved place${favoriteListings.length === 1 ? "" : "s"} ready to reopen`
        : needs
          ? "Your place answers are ready. Browse sites that fit."
          : "Start with a place tonight, or set up rent and bills."

  return (
    <div className="grid gap-8 pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_55%)] opacity-[0.12] dark:opacity-[0.22]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Dashboard</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              {name ? `Welcome back, ${name}` : "Welcome back"}
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
              {empty
                ? "This feed fills with asks, saved places, visits, and deadlines as you use True Roof."
                : heroLine}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/places"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
              >
                <IconMapPin />
                Find a place
              </Link>
              <Link
                href={profile ? "/financials" : "/get-started/financial-help"}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full"
                )}
              >
                <IconWallet />
                {profile ? "Open Financials" : "Set up Financials"}
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <HeroMetric
              label="Next deadline"
              value={
                nextDue
                  ? formatShortDate(nextDue.date)
                  : profile
                    ? "None soon"
                    : "Not set"
              }
              detail={
                nextDue
                  ? nextDue.title
                  : profile
                    ? "Nothing due in the next window"
                    : "Add rent and bills in Financials"
              }
              accent={riskUi?.bar}
            />
            <div className="grid grid-cols-2 gap-3">
              <HeroMetric
                label="Open asks"
                value={String(asks.length)}
                detail="Waitlist or bed requests"
              />
              <HeroMetric
                label="Saved"
                value={String(favoriteListings.length)}
                detail="Places to reopen"
              />
            </div>
            {riskUi ? (
              <div className="rounded-2xl border bg-background/60 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Housing status
                  </p>
                  <p className={cn("text-sm font-semibold", riskUi.tone)}>
                    {riskUi.label}
                  </p>
                </div>
                {profile && profile.savingsGoal > 0 ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Rent cushion</span>
                      <span>{cushionPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${cushionPct}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {empty ? (
        <section className="grid gap-4">
          <SectionHead
            title="Start here"
            body="Pick what you need right now. Your dashboard will fill in after."
          />
          <NeedChoices />
        </section>
      ) : null}

      {/* Snapshot strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          href="/places"
          icon={IconMapPin}
          label="Places"
          value={needs ? "Ready to browse" : "Answer questions"}
          detail={
            needs
              ? "Filters use what you told us"
              : "One minute, then a better list"
          }
        />
        <StatTile
          href={asks[0] ? `/places/${asks[0].listingId}` : "/places"}
          icon={IconPhoneCall}
          label="Your asks"
          value={`${asks.length} open`}
          detail="Not an approval. Staff can see these."
        />
        <StatTile
          href="/financials"
          icon={IconCalendarDue}
          label="Coming up"
          value={
            nextDue
              ? formatShortDate(nextDue.date)
              : profile
                ? "Clear"
                : "Set up"
          }
          detail={nextDue?.title ?? "Rent, bills, and recerts"}
        />
        <StatTile
          href="/places"
          icon={IconHeart}
          label="Saved places"
          value={`${favoriteListings.length}`}
          detail="Tap Save on any site page"
        />
      </section>

      {/* Main grid */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Your asks"
          description="Waitlists, bed requests, and on-the-way notes."
          actionHref="/places"
          actionLabel="Browse Places"
        >
          {asks.length === 0 ? (
            <EmptyLine text="No asks yet. Join a waitlist or ask for a bed on a site page." />
          ) : (
            <ul className="grid gap-2">
              {asks.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/places/${row.listingId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{row.listingName}</p>
                      <p className="text-muted-foreground">
                        {interestLabel[row.kind]}
                      </p>
                    </div>
                    <IconArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Coming up"
          description="Estimates from your plan. Not a payment confirmation."
          actionHref="/financials"
          actionLabel="Financials"
        >
          {upcoming.length === 0 ? (
            <EmptyLine
              text={
                profile
                  ? "Nothing open right now. Check Financials for the full calendar."
                  : "Set up rent and programs so deadlines show here."
              }
            />
          ) : (
            <ul className="grid gap-2">
              {upcoming.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {formatShortDate(item.date)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid gap-4">
        <SectionHead
          title="Saved places"
          body="Sites you marked to come back to. Not a reservation."
          actionHref="/places"
          actionLabel="Find more"
        />
        {favoriteListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No saved places yet. Open a site and tap Save.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteListings.slice(0, 6).map((listing) => {
              const photo = photoForListing(listing)
              return (
                <Link
                  key={listing.id}
                  href={`/places/${listing.id}`}
                  className="group overflow-hidden rounded-2xl border bg-card transition-colors hover:bg-muted/30"
                >
                  <MarketingPhoto
                    photo={photo}
                    className="aspect-[16/10]"
                    sizes="(min-width: 1024px) 33vw, 50vw"
                  />
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {listing.kind === "parking"
                          ? "Safe parking"
                          : "Shelter"}
                      </Badge>
                      <Badge variant="secondary">{listing.city}</Badge>
                    </div>
                    <p className="mt-2 font-heading text-lg font-semibold group-hover:underline">
                      {listing.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {listing.orgName}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Recently looked at"
          description="Sites you opened on this phone."
          actionHref="/places"
          actionLabel="Browse"
        >
          {recent.length === 0 ? (
            <EmptyLine text="Nothing here yet. Open a few sites in Places." />
          ) : (
            <ul className="grid gap-2">
              {recent.slice(0, 8).map((item) => (
                <li key={`${item.id}-${item.viewedAt}`}>
                  <Link
                    href={`/places/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <IconHistory className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          {item.city}
                          {" · "}
                          {item.kind === "parking" ? "Safe parking" : "Shelter"}
                        </p>
                      </div>
                    </div>
                    <IconArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Shortcuts"
          description="Jump to the parts of True Roof you use most."
        >
          <div className="grid gap-2">
            <Shortcut
              href="/places"
              title="Places"
              body="Shelters and safe parking near you"
            />
            <Shortcut
              href={profile ? "/financials" : "/get-started/financial-help"}
              title="Financials"
              body="Rent, bills, cushion, and reminders"
            />
            <Shortcut
              href="/financials/letters"
              title="Photo a letter"
              body="Coming next: one task from a county letter"
            />
            <Shortcut
              href="/financials/income"
              title="Will this job hurt me?"
              body="Coming next: wage vs benefits estimate"
            />
            <Shortcut
              href="/settings"
              title="Your answers"
              body="Household answers and account"
            />
          </div>
        </Panel>
      </section>
    </div>
  )
}

function HeroMetric({
  label,
  value,
  detail,
  accent,
}: {
  label: string
  value: string
  detail: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl border bg-background/60 px-4 py-3 backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
        {detail}
      </p>
      {accent ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full w-2/3 rounded-full", accent)} />
        </div>
      ) : null}
    </div>
  )
}

function StatTile({
  href,
  icon: Icon,
  label,
  value,
  detail,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-3 font-heading text-xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Link>
  )
}

function Panel({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0"
            )}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function SectionHead({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string
  body: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}

function Shortcut({
  href,
  title,
  body,
}: {
  href: string
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-colors hover:bg-muted/50"
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      <IconArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
