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
  { label: string; tone: string; helper: string }
> = {
  steady: {
    label: "Steady",
    tone: "bg-success/10 text-success-text",
    helper: "Nothing is overdue and nothing is due in the next week.",
  },
  watch: {
    label: "Watch",
    tone: "bg-warning/10 text-warning-text",
    helper: "Something is due soon. Pay it down or mark it handled below.",
  },
  act: {
    label: "Act",
    tone: "bg-destructive/10 text-destructive",
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
    if (tab === "notifications" || tab === "scanner") setInitialTab(tab)
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
        lastCheckInFlaggedAt: profile?.lastCheckInFlaggedAt ?? null,
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

  function handleCheckIn(flagged: boolean) {
    const today = isoDate(new Date())
    const next = updateProfile({
      lastCheckInAt: today,
      lastCheckInFlaggedAt: flagged ? today : null,
    })
    if (next) setProfile(next)
    toast.success(
      flagged
        ? "Checked in. Flagged for follow-up."
        : "Checked in. Glad things are steady."
    )
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

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardAction>
              <Badge className={cn("border-0", copy.tone)}>{copy.label}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{copy.helper}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rent cushion</CardTitle>
            <CardDescription>
              ${profile.savingsSaved.toLocaleString()} of $
              {profile.savingsGoal.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${cushionPct}%` }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAddSavings(20)}
            >
              +$20
            </Button>
          </CardContent>
        </Card>

        <CheckInCard
          lastCheckInAt={profile.lastCheckInAt}
          onCheckIn={handleCheckIn}
        />
        <IncomeCard
          monthlyIncome={profile.monthlyIncome}
          onUpdate={handleUpdateIncome}
        />
      </div>

      <DeadlinesCard
        deadlines={profile.deadlines ?? []}
        completedIds={completedIds}
        onAdd={handleAddDeadline}
        onRemove={handleRemoveDeadline}
      />

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="calendar">
            <IconCalendar />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <IconBell />
            Notifications
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

        <TabsContent value="notifications" className="pt-4">
          <NotificationsTab risk={risk} profile={profile} />
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
    </div>
  )
}

function isoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// "YYYY-MM-DD" strings must be parsed as local dates, not UTC — `new
// Date("2026-10-01")` parses as UTC midnight, which renders as Sep 30 in any
// timezone behind UTC.
function parseLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function CheckInCard({
  lastCheckInAt,
  onCheckIn,
}: {
  lastCheckInAt: string | null
  onCheckIn: (flagged: boolean) => void
}) {
  const [asking, setAsking] = React.useState(false)

  const daysSince = lastCheckInAt
    ? Math.round(
        (startOfDayClient(new Date()).getTime() -
          parseLocalDate(lastCheckInAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  function respond(flagged: boolean) {
    onCheckIn(flagged)
    setAsking(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly check-in</CardTitle>
        <CardDescription>
          {daysSince === null
            ? "You have not checked in yet."
            : `Last check-in: ${daysSince} day${daysSince === 1 ? "" : "s"} ago.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {asking ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">
              How are things going this week?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => respond(false)}>
                Good, nothing&apos;s wrong
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => respond(true)}
              >
                Something&apos;s off
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" size="sm" onClick={() => setAsking(true)}>
            Check in
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function startOfDayClient(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function IncomeCard({
  monthlyIncome,
  onUpdate,
}: {
  monthlyIncome: number | null
  onUpdate: (amount: number) => void
}) {
  const [value, setValue] = React.useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly income</CardTitle>
        <CardDescription>
          {monthlyIncome != null
            ? `Currently $${monthlyIncome.toLocaleString()}`
            : "Not set yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
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
      </CardContent>
    </Card>
  )
}

function NotificationsTab({
  risk,
  profile,
}: {
  risk: ReturnType<typeof assessRisk>
  profile: ObligationsProfile
}) {
  return (
    <div className="grid gap-4">
      {risk.reasons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No warnings right now. Check back after your next due date.
        </p>
      ) : (
        <ul className="grid gap-2">
          {risk.reasons.map((reason) => (
            <li key={reason}>
              <Card
                className={cn(
                  "flex-row items-start gap-2 px-4",
                  risk.level === "act"
                    ? "ring-destructive/30"
                    : "ring-warning/30"
                )}
              >
                <IconAlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    risk.level === "act"
                      ? "text-destructive"
                      : "text-warning-text"
                  )}
                />
                <p className="text-sm">{reason}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {risk.level === "act" ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Help</CardTitle>
            <CardDescription className="text-base">
              Pick a door. This does not send anything until you tap one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
