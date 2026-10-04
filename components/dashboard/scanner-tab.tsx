"use client"

import * as React from "react"
import { IconAlertTriangle, IconRefresh, IconScan } from "@tabler/icons-react"
import { toast } from "sonner"

import { AddDeadlineForm } from "@/components/dashboard/deadlines-card"
import { PhotoCapture } from "@/components/dashboard/photo-capture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { isoDate } from "@/lib/obligations/recurrence"
import { scanKindLabel, type ScanResult } from "@/lib/obligations/scan-rules"
import type { Deadline, Payment } from "@/lib/obligations/types"

export function ScannerTab({
  payments,
  onLog,
  onLogShutoffNotice,
  onAddDeadline,
}: {
  payments: Payment[]
  onLog: (payment: Payment) => void
  onLogShutoffNotice: () => void
  onAddDeadline: (deadline: Deadline) => void
}) {
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [reading, setReading] = React.useState(false)
  const [result, setResult] = React.useState<ScanResult | null>(null)
  // Bumped on every new scan so the forms below start fresh from it.
  const [scanId, setScanId] = React.useState(0)

  const [amount, setAmount] = React.useState("")
  const [paidTo, setPaidTo] = React.useState("")
  const [note, setNote] = React.useState("")
  const [isShutoffNotice, setIsShutoffNotice] = React.useState(false)

  function startOver() {
    setPhoto(null)
    setResult(null)
  }

  async function handleRead() {
    if (!photo) return
    setReading(true)
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, today: isoDate(new Date()) }),
      })

      if (response.status === 503) {
        toast.error("The reader is off right now. Type the details in yourself.")
        return
      }
      if (!response.ok) {
        toast.error("Could not read that photo. Try again in better light.")
        return
      }

      const scan = (await response.json()) as ScanResult
      // Read, then discard. The photo is not kept once there is a result.
      setPhoto(null)
      setResult(scan)
      setScanId((n) => n + 1)

      if (scan.payment) {
        setAmount(scan.payment.amount != null ? String(scan.payment.amount) : "")
        setPaidTo(scan.payment.paidTo)
        setNote(scan.summary)
        setIsShutoffNotice(scan.isShutoffNotice)
      }
    } catch {
      toast.error("No connection. Try again, or type the details in yourself.")
    } finally {
      setReading(false)
    }
  }

  function handleAddDeadline(deadline: Deadline) {
    onAddDeadline(deadline)
    if (!result?.payment) setResult(null)
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onLog({
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      amount: Number(amount) || 0,
      paidTo,
      note,
    })

    if (isShutoffNotice) {
      onLogShutoffNotice()
      toast.warning("Flagged as a shutoff notice. Get Help will show it as a warning.")
    }

    setAmount("")
    setPaidTo("")
    setNote("")
    setIsShutoffNotice(false)
    if (result && !result.deadline) setResult(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan a letter, bill, or receipt</CardTitle>
          <CardDescription className="text-base">
            Take a photo. When you tap Read it, the photo is sent to our reader,
            turned into one plain task, then thrown away. It is never saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {photo ? (
            <div className="grid gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, not a hosted image */}
              <img
                src={photo}
                alt="The photo you just took"
                className="max-h-[50vh] w-full rounded-lg bg-muted object-contain"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="lg" onClick={handleRead} disabled={reading}>
                  <IconScan />
                  {reading ? "Reading..." : "Read it"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={startOver}
                  disabled={reading}
                >
                  <IconRefresh />
                  Retake
                </Button>
              </div>
            </div>
          ) : (
            <PhotoCapture
              onPhoto={(dataUrl) => {
                setResult(null)
                setPhoto(dataUrl)
              }}
            />
          )}

          {result ? (
            <ScanResultCard
              key={scanId}
              result={result}
              onAddDeadline={handleAddDeadline}
              onDismiss={() => setResult(null)}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log a payment or receipt</CardTitle>
          <CardDescription className="text-base">
            {result?.payment
              ? "Filled in from your scan. Check it, then log it."
              : "Or type one in yourself."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="payment-amount">Amount</FieldLabel>
                  <Input
                    id="payment-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    required={!isShutoffNotice}
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
              </div>
              <Field>
                <FieldLabel htmlFor="payment-note">Note</FieldLabel>
                <Input
                  id="payment-note"
                  placeholder="October rent"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <FieldLabel htmlFor="payment-shutoff" className="w-fit">
                <Checkbox
                  id="payment-shutoff"
                  checked={isShutoffNotice}
                  onCheckedChange={(checked) => setIsShutoffNotice(Boolean(checked))}
                />
                This is a shutoff or disconnection notice
              </FieldLabel>
              <Button type="submit" className="w-fit">
                Log it
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {payments.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Recent</p>
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

function ScanResultCard({
  result,
  onAddDeadline,
  onDismiss,
}: {
  result: ScanResult
  onAddDeadline: (deadline: Deadline) => void
  onDismiss: () => void
}) {
  const today = isoDate(new Date())

  return (
    <Card className="ring-primary/30" aria-live="polite">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{scanKindLabel[result.kind]}</Badge>
          {result.isShutoffNotice ? (
            <Badge variant="destructive">
              <IconAlertTriangle />
              Act soon
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-base">
          {result.summary || "We could not tell what this is."}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {result.deadline ? (
          <>
            <p className="text-sm text-muted-foreground">
              Check the task below, fix anything that is wrong, then add it.
            </p>
            <AddDeadlineForm
              today={today}
              onAdd={onAddDeadline}
              initial={result.deadline}
              showSentence={false}
              idPrefix="scan"
            />
          </>
        ) : result.payment ? (
          <p className="text-sm text-muted-foreground">
            We filled in the payment form below. Check it, then tap Log it.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            We did not find a date or a payment on this. Try a clearer photo,
            or add it yourself under Your deadlines.
          </p>
        )}
        {result.deadline && result.payment ? <Separator /> : null}
        {result.deadline && result.payment ? (
          <p className="text-sm text-muted-foreground">
            The payment form below is filled in too.
          </p>
        ) : null}
        <Button type="button" variant="ghost" className="w-fit" onClick={onDismiss}>
          Dismiss
        </Button>
      </CardContent>
    </Card>
  )
}
