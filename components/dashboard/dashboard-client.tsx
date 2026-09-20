"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconBell,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconPhoneCall,
  IconSettings,
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
  clearAllData,
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

  function handleClearData() {
    clearAllData()
    setProfile(null)
    setCompletedIds([])
    setPayments([])
    toast.success("Your data was deleted from this device.")
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
          <TabsTrigger value="settings">
            <IconSettings />
            Settings
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

        <TabsContent value="settings" className="pt-4">
          <SettingsTab profile={profile} onClearData={handleClearData} />
        </TabsContent>
      </Tabs>
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
  if (occurrences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing scheduled yet. Add rent and bills in Settings.
      </p>
    )
  }

  const completed = new Set(completedIds)

  return (
    <ol className="grid gap-2">
      {occurrences.map((occurrence) => {
        const isDone = completed.has(occurrence.id)
        return (
          <li key={occurrence.id}>
            <Card
              className={cn(
                "flex-row items-center justify-between gap-3 px-4",
                isDone && "opacity-50"
              )}
            >
              <div>
                <p className="text-xs font-medium text-primary">
                  {occurrence.date}
                </p>
                <p className={cn("font-medium", isDone && "line-through")}>
                  {occurrence.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {occurrence.detail}
                </p>
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
          </li>
        )
      })}
    </ol>
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

function SettingsTab({
  profile,
  onClearData,
}: {
  profile: ObligationsProfile
  onClearData: () => void
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Your plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm">
          <p>Move-in date: {profile.moveInDate || "Not set"}</p>
          <p>
            Rent: ${profile.rentAmount.toLocaleString()} due on day{" "}
            {profile.rentDueDay}
          </p>
          <p>
            Programs:{" "}
            {profile.programs.length > 0
              ? profile.programs.map((p) => p.label).join(", ")
              : "None yet"}
          </p>
          <p>
            Case manager:{" "}
            {profile.caseManagerName || profile.caseManagerContact
              ? `${profile.caseManagerName} ${profile.caseManagerContact}`.trim()
              : "Not set"}
          </p>
        </CardContent>
        <CardContent>
          <Link
            href="/get-started/financial-help"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit my plan
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription className="text-base">
            Your plan and payment log live only on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={onClearData}>
            Delete my data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
