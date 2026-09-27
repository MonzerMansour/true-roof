"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconBell,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconLayoutList,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"
import { assessRisk, buildOccurrences, type RiskLevel } from "@/lib/obligations/schedule"
import {
  addPayment,
  loadCompletedOccurrenceIds,
  loadPayments,
  loadProfile,
  toggleOccurrenceCompleted,
  updateProfile,
} from "@/lib/obligations/storage"
import type { ObligationsProfile, Occurrence, Payment } from "@/lib/obligations/types"

const riskCopy: Record<RiskLevel, { label: string; tone: string; helper: string }> = {
  steady: {
    label: "Steady",
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    helper: "Nothing is overdue and nothing is due in the next week.",
  },
  watch: {
    label: "Watch",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
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

  React.useEffect(() => {
    setProfile(loadProfile())
    setCompletedIds(loadCompletedOccurrenceIds())
    setPayments(loadPayments())
    setLoaded(true)
  }, [])

  const occurrences = React.useMemo(
    () => (profile ? buildOccurrences(profile) : []),
    [profile]
  )

  const risk = React.useMemo(
    () => assessRisk(occurrences, completedIds),
    [occurrences, completedIds]
  )

  function handleToggle(id: string) {
    toggleOccurrenceCompleted(id)
    setCompletedIds(loadCompletedOccurrenceIds())
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

  if (!loaded) return null

  if (!profile) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Set up your plan first</CardTitle>
          <CardDescription className="text-base">
            Answer a few questions about rent and programs, then your
            dashboard will fill in here.
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
      ? Math.min(100, Math.round((profile.savingsSaved / profile.savingsGoal) * 100))
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
      </div>

      <Tabs defaultValue="calendar">
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
            completedIds={completedIds}
            onToggle={handleToggle}
          />
        </TabsContent>

        <TabsContent value="notifications" className="pt-4">
          <NotificationsTab risk={risk} profile={profile} />
        </TabsContent>

        <TabsContent value="scanner" className="pt-4">
          <ScannerTab payments={payments} onLog={handleLogPayment} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OccurrenceRow({
  occurrence,
  isDone,
  onToggle,
  showDate = true,
}: {
  occurrence: Occurrence
  isDone: boolean
  onToggle: (id: string) => void
  showDate?: boolean
}) {
  return (
    <Card
      className={cn(
        "flex-row items-center justify-between gap-3 px-4",
        isDone && "opacity-50"
      )}
    >
      <div>
        {showDate ? (
          <p className="text-xs font-medium text-primary">{occurrence.date}</p>
        ) : null}
        <p className={cn("font-medium", isDone && "line-through")}>
          {occurrence.title}
        </p>
        <p className="text-sm text-muted-foreground">{occurrence.detail}</p>
      </div>
      <Button
        type="button"
        variant={isDone ? "secondary" : "outline"}
        size="sm"
        onClick={() => onToggle(occurrence.id)}
      >
        <IconCheck />
        {isDone ? "Done" : "Mark done"}
      </Button>
    </Card>
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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function MonthCalendar({
  occurrences,
  completedIds,
  onToggle,
}: {
  occurrences: Occurrence[]
  completedIds: string[]
  onToggle: (id: string) => void
}) {
  const today = new Date()
  const [cursor, setCursor] = React.useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selected, setSelected] = React.useState(() => isoDate(today))

  const byDate = React.useMemo(() => {
    const map = new Map<string, Occurrence[]>()
    for (const occurrence of occurrences) {
      const list = map.get(occurrence.date) ?? []
      list.push(occurrence)
      map.set(occurrence.date, list)
    }
    return map
  }, [occurrences])

  const cells = React.useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(firstOfMonth)
    start.setDate(start.getDate() - firstOfMonth.getDay())

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return {
        date,
        iso: isoDate(date),
        inMonth: date.getMonth() === cursor.getMonth(),
      }
    })
  }, [cursor])

  const todayIso = isoDate(today)
  const completed = new Set(completedIds)
  const selectedItems = byDate.get(selected) ?? []

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-lg font-medium">
          {cursor.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() =>
              setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
            }
          >
            <IconChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelected(todayIso)
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() =>
              setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
            }
          >
            <IconChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, iso, inMonth }) => {
          const items = byDate.get(iso) ?? []
          const hasUndone = items.some((item) => !completed.has(item.id))
          const isSelected = iso === selected

          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelected(iso)}
              aria-label={
                date.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }) + (items.length > 0 ? `, ${items.length} due` : "")
              }
              aria-pressed={isSelected}
              className={cn(
                "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border p-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-2",
                inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                isSelected && "border-primary ring-2 ring-primary/40",
                iso === todayIso && "font-semibold text-primary"
              )}
            >
              <span>{date.getDate()}</span>
              {items.length > 0 ? (
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    hasUndone ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {parseLocalDate(selected).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due this day.</p>
        ) : (
          selectedItems.map((occurrence) => (
            <OccurrenceRow
              key={occurrence.id}
              occurrence={occurrence}
              isDone={completed.has(occurrence.id)}
              onToggle={onToggle}
              showDate={false}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CalendarTab({
  occurrences,
  completedIds,
  onToggle,
}: {
  occurrences: Occurrence[]
  completedIds: string[]
  onToggle: (id: string) => void
}) {
  const [view, setView] = React.useState<"list" | "month">("list")

  if (occurrences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing scheduled yet. Set up your plan in{" "}
        <Link href="/get-started/financial-help" className="font-medium underline">
          Financials setup
        </Link>
        .
      </p>
    )
  }

  const completed = new Set(completedIds)

  return (
    <div className="grid gap-4">
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-[3px]">
        <Button
          type="button"
          variant={view === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("list")}
        >
          <IconLayoutList />
          List
        </Button>
        <Button
          type="button"
          variant={view === "month" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("month")}
        >
          <IconLayoutGrid />
          Month
        </Button>
      </div>

      {view === "list" ? (
        <ol className="grid gap-2">
          {occurrences.map((occurrence) => (
            <li key={occurrence.id}>
              <OccurrenceRow
                occurrence={occurrence}
                isDone={completed.has(occurrence.id)}
                onToggle={onToggle}
              />
            </li>
          ))}
        </ol>
      ) : (
        <MonthCalendar
          occurrences={occurrences}
          completedIds={completedIds}
          onToggle={onToggle}
        />
      )}
    </div>
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
                  risk.level === "act" ? "ring-destructive/30" : "ring-amber-500/30"
                )}
              >
                <IconAlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    risk.level === "act" ? "text-destructive" : "text-amber-500"
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
            <a href="tel:211" className={cn(buttonVariants({ variant: "outline" }))}>
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

function ScannerTab({
  payments,
  onLog,
}: {
  payments: Payment[]
  onLog: (payment: Payment) => void
}) {
  const [amount, setAmount] = React.useState("")
  const [paidTo, setPaidTo] = React.useState("")
  const [note, setNote] = React.useState("")
  const [fileName, setFileName] = React.useState<string | null>(null)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onLog({
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      amount: Number(amount) || 0,
      paidTo,
      note,
    })

    setAmount("")
    setPaidTo("")
    setNote("")
    setFileName(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Log a payment or receipt</CardTitle>
          <CardDescription className="text-base">
            Attach a photo if you have one. The photo stays on this device and
            is not stored after you log the payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="payment-amount">Amount</FieldLabel>
                  <Input
                    id="payment-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="payment-paid-to">Paid to</FieldLabel>
                  <Input
                    id="payment-paid-to"
                    placeholder="Westgate Property Management"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                  />
                </Field>
              </Field>
              <Field>
                <FieldLabel htmlFor="payment-photo">Photo (optional)</FieldLabel>
                <Input
                  id="payment-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
                {fileName ? (
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="payment-note">Note</FieldLabel>
                <Input
                  id="payment-note"
                  placeholder="October rent"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <Button type="submit" className="w-fit">
                Log it
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {payments.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Recent
          </p>
          <ul className="grid gap-2">
            {payments.map((payment) => (
              <li key={payment.id}>
                <Card className="flex-row items-center justify-between px-4">
                  <div>
                    <p className="font-medium">
                      ${payment.amount.toLocaleString()}
                      {payment.paidTo ? ` to ${payment.paidTo}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.note || "No note"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.loggedAt).toLocaleDateString()}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
