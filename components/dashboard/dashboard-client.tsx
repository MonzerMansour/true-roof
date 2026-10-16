"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconBell,
  IconCalendar,
  IconCamera,
  IconMail,
  IconPhoneCall,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { useSession } from "@/components/auth/session-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeadlinesCard } from "@/components/dashboard/deadlines-card"
import { ShowMoreDialog } from "@/components/dashboard/show-more-dialog"
import { CalendarTab } from "@/components/dashboard/calendar-tab"
import { ScannerTab } from "@/components/dashboard/scanner-tab"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"
import {
  criticallyOverdueIds,
  loadAlertEmailOptIn,
  maybeSendLateAlertEmail,
  overdueOccurrenceIds,
  saveAlertEmailOptIn,
} from "@/lib/obligations/alert-email"
import {
  assessRisk,
  buildSchedule,
  type RiskLevel,
} from "@/lib/obligations/schedule"
import {
  addPayment,
  loadCompletedOccurrenceIds,
  loadPayments,
  loadProfile,
  setOccurrenceCompleted,
  updateProfile,
} from "@/lib/obligations/storage"
import type {
  Deadline,
  ObligationsProfile,
  Occurrence,
  Payment,
} from "@/lib/obligations/types"

const riskCopy: Record<
  RiskLevel,
  { label: string; text: string; helper: string; shell: string; dot: string }
> = {
  steady: {
    label: "Steady",
    text: "text-success-text",
    helper: "Nothing due this week.",
    shell: "border-success/25 bg-success/5",
    dot: "bg-success",
  },
  watch: {
    label: "Watch",
    text: "text-warning-text",
    helper: "Something is due soon.",
    shell: "border-warning/30 bg-warning/5",
    dot: "bg-warning",
  },
  act: {
    label: "Act",
    text: "text-destructive",
    helper: "Something is overdue.",
    shell: "border-destructive/35 bg-destructive/5",
    dot: "bg-destructive",
  },
}

export function DashboardClient() {
  const { session } = useSession()
  const [profile, setProfile] = React.useState<ObligationsProfile | null>(null)
  const [completedIds, setCompletedIds] = React.useState<string[]>([])
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [initialTab, setInitialTab] = React.useState("calendar")
  const [emailAlerts, setEmailAlerts] = React.useState(false)
  const [editingDeadlineId, setEditingDeadlineId] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab === "scanner") setInitialTab(tab)
    setProfile(loadProfile())
    setCompletedIds(loadCompletedOccurrenceIds())
    setPayments(loadPayments())
    setEmailAlerts(loadAlertEmailOptIn())
    setLoaded(true)
  }, [])

  const schedule = React.useMemo(
    () =>
      profile
        ? buildSchedule(profile, completedIds)
        : { upcoming: [], done: [] },
    [profile, completedIds]
  )
  const occurrences = schedule.upcoming

  const risk = React.useMemo(
    () =>
      assessRisk(occurrences, completedIds, {
        monthlyIncome: profile?.monthlyIncome ?? null,
        previousMonthlyIncome: profile?.previousMonthlyIncome ?? null,
        incomeUpdatedAt: profile?.incomeUpdatedAt ?? null,
        lastShutoffNoticeAt: profile?.lastShutoffNoticeAt ?? null,
        lastCheckInAt: profile?.lastCheckInAt ?? null,
      }),
    [occurrences, completedIds, profile]
  )

  React.useEffect(() => {
    if (!loaded || !session || !profile || !emailAlerts) return
    const criticalIds = criticallyOverdueIds(occurrences, completedIds)
    const overdueIds = overdueOccurrenceIds(occurrences, completedIds)
    void maybeSendLateAlertEmail({
      level: risk.level,
      reasons: risk.reasons,
      occurrenceIds: criticalIds.length > 0 ? criticalIds : overdueIds,
    })
  }, [
    loaded,
    session,
    profile,
    emailAlerts,
    risk.level,
    risk.reasons,
    occurrences,
    completedIds,
  ])

  function setDone(id: string, done: boolean) {
    setOccurrenceCompleted(id, done)
    setCompletedIds(loadCompletedOccurrenceIds())
  }

  function handleMarkDone(occurrence: Occurrence) {
    setDone(occurrence.id, true)
    toast.success(`Marked done: ${occurrence.title}`, {
      action: { label: "Undo", onClick: () => setDone(occurrence.id, false) },
    })
  }

  function handleMarkAllDone(items: Occurrence[]) {
    if (items.length === 0) return
    const setAll = (done: boolean) => {
      for (const item of items) setOccurrenceCompleted(item.id, done)
      setCompletedIds(loadCompletedOccurrenceIds())
    }
    setAll(true)
    toast.success(`Marked ${items.length} done: ${items[0].title}`, {
      action: { label: "Undo", onClick: () => setAll(false) },
    })
  }

  function handleUndo(occurrence: Occurrence) {
    setDone(occurrence.id, false)
    toast.success(`Moved back to your list: ${occurrence.title}`)
  }

  function handleLogPayment(payment: Payment) {
    addPayment(payment)
    setPayments(loadPayments())
    toast.success("Payment logged.")
  }

  // The handlers below read the saved plan, not this screen's copy of it. With
  // the app open in two tabs, this screen's copy can be out of date, and
  // writing it back would erase what the other tab saved.
  function handleAddSavings(amount: number) {
    const next = updateProfile({
      savingsSaved: (loadProfile()?.savingsSaved ?? 0) + amount,
    })
    if (next) setProfile(next)
  }

  function handleCheckIn() {
    const next = updateProfile({ lastCheckInAt: isoDate(new Date()) })
    if (next) setProfile(next)
    toast.success("Checked in. Update anything that has changed.")
  }

  function handleUpdateIncome(amount: number) {
    if (!Number.isFinite(amount) || amount < 0) return
    const next = updateProfile({
      previousMonthlyIncome: loadProfile()?.monthlyIncome ?? null,
      monthlyIncome: amount,
      incomeUpdatedAt: isoDate(new Date()),
    })
    if (next) setProfile(next)
    toast.success("Income updated.")
  }

  function handleAddDeadline(deadline: Deadline) {
    const next = updateProfile({
      deadlines: [...(loadProfile()?.deadlines ?? []), deadline],
    })
    if (next) setProfile(next)
  }

  function handleUpdateDeadline(deadline: Deadline) {
    const next = updateProfile({
      deadlines: (loadProfile()?.deadlines ?? []).map((d) =>
        d.id === deadline.id ? deadline : d
      ),
    })
    if (next) setProfile(next)
  }

  // Removes the deadline and every date it repeats on. Undo puts it back.
  function handleRemoveDeadline(id: string) {
    const removed = (loadProfile()?.deadlines ?? []).find((d) => d.id === id)
    if (!removed) return

    const next = updateProfile({
      deadlines: (loadProfile()?.deadlines ?? []).filter((d) => d.id !== id),
    })
    if (next) setProfile(next)

    toast.success(
      removed.repeat
        ? `Removed ${removed.title} and all its repeats.`
        : `Removed ${removed.title}.`,
      {
        action: {
          label: "Undo",
          onClick: () => {
            const current = loadProfile()
            if (!current || current.deadlines?.some((d) => d.id === id)) return
            const restored = updateProfile({
              deadlines: [...(current.deadlines ?? []), removed],
            })
            if (restored) setProfile(restored)
          },
        },
      }
    )
  }

  // Deletes one date of a typed deadline. A one-time deadline has only one
  // date, so that removes it entirely. Undo puts the date back.
  function handleDeleteOne(occurrence: Occurrence) {
    const id = occurrence.deadlineId
    if (!id) return
    if (!occurrence.repeats) {
      handleRemoveDeadline(id)
      return
    }

    const setSkipped = (change: (dates: string[]) => string[]) => {
      const current = loadProfile()
      if (!current) return
      const next = updateProfile({
        deadlines: (current.deadlines ?? []).map((d) =>
          d.id === id ? { ...d, skippedDates: change(d.skippedDates ?? []) } : d
        ),
      })
      if (next) setProfile(next)
    }

    setSkipped((dates) => [...new Set([...dates, occurrence.date])])
    toast.success(
      `Deleted ${occurrence.title} on ${occurrence.date}. Other dates stay.`,
      {
        action: {
          label: "Undo",
          onClick: () =>
            setSkipped((dates) => dates.filter((d) => d !== occurrence.date)),
        },
      }
    )
  }

  function handleLogShutoffNotice() {
    const next = updateProfile({ lastShutoffNoticeAt: isoDate(new Date()) })
    if (next) setProfile(next)
  }

  if (!loaded) return null

  if (!profile) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your plan first</CardTitle>
          <CardDescription className="text-base">
            Answer a few questions about rent and programs, then your dashboard
            will fill in here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/get-started/financial-help"
            className={cn(buttonVariants())}
          >
            Set up my plan
          </Link>
        </CardContent>
      </Card>
    )
  }

  const copy = riskCopy[risk.level]
  const cushionPct =
    profile.savingsGoal > 0
      ? Math.min(
          100,
          Math.round((profile.savingsSaved / profile.savingsGoal) * 100)
        )
      : 0

  const nextDue = occurrences[0] ?? null
  const nextDueOverdue = nextDue ? nextDue.date < isoDate(new Date()) : false

  return (
    <div className="grid gap-6">
      <Card className={cn("overflow-hidden ring-1", copy.shell)}>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0">
          <div className="grid content-between gap-6 lg:pr-8">
            <div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    copy.dot,
                    risk.level === "act" && "animate-pulse"
                  )}
                  aria-hidden
                />
                Status
              </p>
              <p
                className={cn(
                  "mt-1 font-heading text-5xl font-semibold tracking-tight",
                  copy.text
                )}
              >
                {copy.label}
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {copy.helper}
              </p>
              {risk.level !== "steady" ? (
                <a
                  href="#financials-calendar"
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "mt-4 w-fit"
                  )}
                >
                  <IconCalendar />
                  Open calendar
                </a>
              ) : null}
            </div>
            <CheckInRow
              lastCheckInAt={profile.lastCheckInAt}
              onCheckIn={handleCheckIn}
            />
            {session ? (
              <label className="flex min-h-11 items-center justify-between gap-3 border-t pt-4">
                <span className="text-sm font-medium">
                  Email me when something is late
                </span>
                <Switch
                  checked={emailAlerts}
                  onCheckedChange={(checked) => {
                    setEmailAlerts(checked)
                    saveAlertEmailOptIn(checked)
                  }}
                  aria-label="Email me when something is late"
                />
              </label>
            ) : null}
          </div>

          <div className="grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:border-t-0 lg:border-l">
            <Stat label="Next due">
              {nextDue ? (
                <>
                  <p
                    className={cn(
                      "font-heading text-3xl font-semibold tracking-tight",
                      nextDueOverdue && "text-destructive"
                    )}
                  >
                    {parseLocalDate(nextDue.date).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )}
                  </p>
                  <p className="text-sm [overflow-wrap:anywhere]">
                    {nextDueOverdue ? "Overdue: " : ""}
                    {nextDue.title}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing scheduled yet.
                </p>
              )}
            </Stat>

            <Stat label="Rent cushion">
              <p className="font-heading text-3xl font-semibold tracking-tight">
                ${profile.savingsSaved.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  of ${profile.savingsGoal.toLocaleString()}
                </span>
              </p>
              <div
                role="progressbar"
                aria-label="Rent cushion saved"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={cushionPct}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${cushionPct}%` }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => handleAddSavings(20)}
              >
                +$20
              </Button>
            </Stat>

            <IncomeStat
              monthlyIncome={profile.monthlyIncome}
              onUpdate={handleUpdateIncome}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
        <Card
          id="financials-calendar"
          className="order-2 scroll-mt-24 lg:order-1 lg:col-span-2 lg:row-span-2"
        >
          <CardContent>
            <Tabs defaultValue={initialTab}>
              <TabsList>
                <TabsTrigger value="calendar">
                  <IconCalendar />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="scanner">
                  <IconCamera />
                  Scanner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="pt-4">
                <CalendarTab
                  occurrences={occurrences}
                  done={schedule.done}
                  onMarkDone={handleMarkDone}
                  onMarkAllDone={handleMarkAllDone}
                  onUndo={handleUndo}
                  onRemoveDeadline={handleRemoveDeadline}
                  onDeleteOne={handleDeleteOne}
                  onEditDeadline={setEditingDeadlineId}
                />
              </TabsContent>

              <TabsContent value="scanner" className="pt-4">
                <ScannerTab
                  payments={payments}
                  onLog={handleLogPayment}
                  onLogShutoffNotice={handleLogShutoffNotice}
                  onAddDeadline={handleAddDeadline}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <AttentionPanel
          className="order-1 lg:order-2"
          risk={risk}
          profile={profile}
        />

        <div className="order-3">
          <DeadlinesCard
            deadlines={profile.deadlines ?? []}
            completedIds={completedIds}
            onAdd={handleAddDeadline}
            onUpdate={handleUpdateDeadline}
            editingId={editingDeadlineId}
            onEditingIdChange={setEditingDeadlineId}
            onRemove={handleRemoveDeadline}
          />
        </div>
      </div>
    </div>
  )
}

function isoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// "YYYY-MM-DD" strings must be parsed as local dates, not UTC. `new
// Date("2026-10-01")` parses as UTC midnight, which renders as Sep 30 in any
// timezone behind UTC.
function parseLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function startOfDayClient(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function Stat({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid content-start gap-2 py-4 sm:px-5 sm:py-1 sm:first:pl-0 lg:first:pl-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function CheckInRow({
  lastCheckInAt,
  onCheckIn,
}: {
  lastCheckInAt: string | null
  onCheckIn: () => void
}) {
  const daysSince = lastCheckInAt
    ? Math.round(
        (startOfDayClient(new Date()).getTime() -
          parseLocalDate(lastCheckInAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {daysSince === null
          ? "No check-in yet"
          : daysSince <= 0
            ? "Checked in today"
            : `Last check-in: ${daysSince}d ago`}
      </p>
      <Button type="button" size="sm" className="w-fit" onClick={onCheckIn}>
        Check in
      </Button>
    </div>
  )
}

function IncomeStat({
  monthlyIncome,
  onUpdate,
}: {
  monthlyIncome: number | null
  onUpdate: (amount: number) => void
}) {
  const [value, setValue] = React.useState("")

  return (
    <Stat label="Monthly income">
      <p className="font-heading text-3xl font-semibold tracking-tight">
        {monthlyIncome != null
          ? `$${monthlyIncome.toLocaleString()}`
          : "Not set"}
      </p>
      <div className="grid gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Amount"
          aria-label="New monthly income"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={value === "" || !(Number(value) >= 0)}
          onClick={() => {
            onUpdate(Number(value))
            setValue("")
          }}
        >
          Update
        </Button>
      </div>
    </Stat>
  )
}

// The setup asks for "phone or email", so the button has to work for either.
function caseManagerAction(contact: string) {
  const value = contact.trim()
  if (!value) return null
  if (value.includes("@")) {
    return { href: `mailto:${value}`, email: true }
  }
  const digits = value.replace(/[^0-9+]/g, "")
  return digits.length >= 3 ? { href: `tel:${digits}`, email: false } : null
}

function ReasonList({
  reasons,
  level,
}: {
  reasons: string[]
  level: RiskLevel
}) {
  return (
    <ul className="grid divide-y">
      {reasons.map((reason) => (
        <li key={reason} className="flex items-start gap-2 py-2 first:pt-0">
          <IconAlertTriangle
            className={cn(
              "mt-0.5 size-4 shrink-0",
              level === "act" ? "text-destructive" : "text-warning-text"
            )}
          />
          <p className="text-sm [overflow-wrap:anywhere]">{reason}</p>
        </li>
      ))}
    </ul>
  )
}

// Warnings arrive most serious first, so the first few are the ones that matter.
const REASON_LIMIT = 4

function AttentionPanel({
  risk,
  profile,
  className,
}: {
  risk: ReturnType<typeof assessRisk>
  profile: ObligationsProfile
  className?: string
}) {
  const hidden = risk.reasons.length - REASON_LIMIT
  const contactAction = caseManagerAction(profile.caseManagerContact)
  const copy = riskCopy[risk.level]

  return (
    <Card
      className={cn(
        "overflow-hidden ring-1",
        risk.level === "act"
          ? "border-destructive/35 ring-destructive/20"
          : risk.level === "watch"
            ? "border-warning/30 ring-warning/15"
            : "ring-primary/10",
        className
      )}
    >
      <CardHeader
        className={cn(
          risk.level === "act" && "bg-destructive/5",
          risk.level === "watch" && "bg-warning/5"
        )}
      >
        <CardTitle className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              risk.level === "act"
                ? "bg-destructive/15 text-destructive"
                : risk.level === "watch"
                  ? "bg-warning/15 text-warning-text"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <IconBell className="size-4" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {risk.level === "act"
                ? "Needs action now"
                : risk.level === "watch"
                  ? "Due soon"
                  : "All clear"}
            </span>
            <span className={cn("font-heading text-xl", copy.text)}>
              {copy.label}
            </span>
          </span>
        </CardTitle>
        {risk.reasons.length > 0 ? (
          <CardAction>
            <Badge
              variant={risk.level === "act" ? "destructive" : "secondary"}
            >
              {risk.reasons.length}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3">
        {risk.reasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing needs you.</p>
        ) : (
          <ReasonList
            reasons={risk.reasons.slice(0, REASON_LIMIT)}
            level={risk.level}
          />
        )}

        {hidden > 0 ? (
          <ShowMoreDialog
            label={`${hidden} more`}
            title={`Needs attention (${risk.reasons.length})`}
          >
            {() => <ReasonList reasons={risk.reasons} level={risk.level} />}
          </ShowMoreDialog>
        ) : null}

        {risk.level !== "steady" ? (
          <a
            href="#financials-calendar"
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            <IconCalendar />
            Open calendar
          </a>
        ) : null}

        {risk.level === "act" ? (
          <div className="flex flex-wrap gap-2">
            <a
              href="tel:211"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <IconPhoneCall />
              211
            </a>
            {contactAction ? (
              <a
                href={contactAction.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                {contactAction.email ? <IconMail /> : <IconPhoneCall />}
                {profile.caseManagerName || "Case manager"}
              </a>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
