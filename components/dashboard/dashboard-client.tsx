"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconBell,
  IconCalendar,
  IconCamera,
  IconPhoneCall,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeadlinesCard } from "@/components/dashboard/deadlines-card"
import { CalendarTab } from "@/components/dashboard/calendar-tab"
import { ScannerTab } from "@/components/dashboard/scanner-tab"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"
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
  { label: string; text: string; helper: string }
> = {
  steady: {
    label: "Steady",
    text: "text-success-text",
    helper: "Nothing is overdue and nothing is due in the next week.",
  },
  watch: {
    label: "Watch",
    text: "text-warning-text",
    helper: "Something is due soon. Pay it down or mark it handled below.",
  },
  act: {
    label: "Act",
    text: "text-destructive",
    helper: "Something is overdue. Use Get Help below if you cannot cover it.",
  },
}

export function DashboardClient() {
  const [profile, setProfile] = React.useState<ObligationsProfile | null>(null)
  const [completedIds, setCompletedIds] = React.useState<string[]>([])
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [initialTab, setInitialTab] = React.useState("calendar")

  React.useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab === "scanner") setInitialTab(tab)
    setProfile(loadProfile())
    setCompletedIds(loadCompletedOccurrenceIds())
    setPayments(loadPayments())
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

  function handleUndo(occurrence: Occurrence) {
    setDone(occurrence.id, false)
    toast.success(`Moved back to your list: ${occurrence.title}`)
  }

  function handleLogPayment(payment: Payment) {
    addPayment(payment)
    setPayments(loadPayments())
    toast.success("Payment logged.")
  }

  function handleAddSavings(amount: number) {
    const next = updateProfile({
      savingsSaved: (profile?.savingsSaved ?? 0) + amount,
    })
    if (next) setProfile(next)
  }

  function handleCheckIn() {
    const next = updateProfile({ lastCheckInAt: isoDate(new Date()) })
    if (next) setProfile(next)
    toast.success("Checked in. Update anything that has changed.")
  }

  function handleUpdateIncome(amount: number) {
    const next = updateProfile({
      previousMonthlyIncome: profile?.monthlyIncome ?? null,
      monthlyIncome: amount,
      incomeUpdatedAt: isoDate(new Date()),
    })
    if (next) setProfile(next)
    toast.success("Income updated.")
  }

  function handleAddDeadline(deadline: Deadline) {
    const next = updateProfile({
      deadlines: [...(profile?.deadlines ?? []), deadline],
    })
    if (next) setProfile(next)
  }

  // Removes the deadline and every date it repeats on. Undo puts it back.
  function handleRemoveDeadline(id: string) {
    const removed = (profile?.deadlines ?? []).find((d) => d.id === id)
    if (!removed) return

    const next = updateProfile({
      deadlines: (profile?.deadlines ?? []).filter((d) => d.id !== id),
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
    toast.success(`Deleted ${occurrence.title} on ${occurrence.date}. Other dates stay.`, {
      action: {
        label: "Undo",
        onClick: () => setSkipped((dates) => dates.filter((d) => d !== occurrence.date)),
      },
    })
  }

  function handleLogShutoffNotice() {
    const next = updateProfile({ lastShutoffNoticeAt: isoDate(new Date()) })
    if (next) setProfile(next)
  }

  if (!loaded) return null

  if (!profile) {
    return (
      <Card className="mx-auto max-w-md">
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
      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0">
          <div className="grid content-between gap-6 lg:pr-8">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
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
            </div>
            <CheckInRow
              lastCheckInAt={profile.lastCheckInAt}
              onCheckIn={handleCheckIn}
            />
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
                  <p className="text-sm">
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
        <Card className="order-2 lg:order-1 lg:col-span-2 lg:row-span-2">
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
                  onUndo={handleUndo}
                  onRemoveDeadline={handleRemoveDeadline}
                  onDeleteOne={handleDeleteOne}
                  onAddDeadline={handleAddDeadline}
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
    <div className="grid gap-2 border-t pt-4">
      <p className="text-sm font-medium">Weekly check-in</p>
      <p className="text-sm text-muted-foreground">
        {daysSince === null
          ? "You have not checked in yet."
          : `Last check-in: ${daysSince} day${daysSince === 1 ? "" : "s"} ago.`}{" "}
        Has anything changed? Update your income, savings, or deadlines.
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
        {monthlyIncome != null ? `$${monthlyIncome.toLocaleString()}` : "Not set"}
      </p>
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Amount"
          aria-label="New monthly income"
          className="min-w-0 flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!value}
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

function AttentionPanel({
  risk,
  profile,
  className,
}: {
  risk: ReturnType<typeof assessRisk>
  profile: ObligationsProfile
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBell className="size-4" />
          Needs attention
        </CardTitle>
        {risk.reasons.length > 0 ? (
          <CardAction>
            <Badge variant="secondary">{risk.reasons.length}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        {risk.reasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No warnings right now. Check back after your next due date.
          </p>
        ) : (
          <ul className="grid divide-y">
            {risk.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 py-2 first:pt-0">
                <IconAlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    risk.level === "act"
                      ? "text-destructive"
                      : "text-warning-text"
                  )}
                />
                <p className="text-sm">{reason}</p>
              </li>
            ))}
          </ul>
        )}

        {risk.level === "act" ? (
          <div className="grid gap-3 rounded-lg border p-3">
            <div>
              <p className="font-medium">Get Help</p>
              <p className="text-sm text-muted-foreground">
                Pick a door. This does not send anything until you tap one.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="tel:211"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <IconPhoneCall />
                Call 211
              </a>
              {profile.caseManagerContact ? (
                <a
                  href={`tel:${profile.caseManagerContact.replace(/[^0-9+]/g, "")}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  <IconPhoneCall />
                  Call {profile.caseManagerName || "case manager"}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
