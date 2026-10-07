"use client"

import * as React from "react"
import { IconAlertTriangle, IconArrowRight } from "@tabler/icons-react"

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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { runIncomeCheck, type IncomeCheckResult } from "@/lib/income/calculator"
import { loadProfile } from "@/lib/obligations/storage"

function money(amount: number) {
  return `$${Math.round(amount).toLocaleString()}`
}

export function IncomeCheckForm() {
  const [householdSize, setHouseholdSize] = React.useState("1")
  const [currentIncome, setCurrentIncome] = React.useState("")
  const [newIncome, setNewIncome] = React.useState("")
  const [hasVoucher, setHasVoucher] = React.useState(false)
  const [currentRentShare, setCurrentRentShare] = React.useState("")
  const [hasCalFresh, setHasCalFresh] = React.useState(false)
  const [currentCalFreshBenefit, setCurrentCalFreshBenefit] = React.useState("")
  const [hasMediCal, setHasMediCal] = React.useState(false)
  const [result, setResult] = React.useState<IncomeCheckResult | null>(null)

  React.useEffect(() => {
    const profile = loadProfile()
    if (!profile) return

    if (profile.monthlyIncome != null) {
      setCurrentIncome(String(profile.monthlyIncome))
    }
    setHasVoucher(profile.programs.some((p) => p.kind === "housing_voucher"))
    setHasCalFresh(profile.programs.some((p) => p.kind === "calfresh"))
    setHasMediCal(profile.programs.some((p) => p.kind === "medi_cal"))
  }, [])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setResult(
      runIncomeCheck({
        householdSize: Number(householdSize) || 1,
        currentMonthlyIncome: Number(currentIncome) || 0,
        newMonthlyIncome: Number(newIncome) || 0,
        hasVoucher,
        currentRentShare: Number(currentRentShare) || 0,
        hasCalFresh,
        currentCalFreshBenefit: Number(currentCalFreshBenefit) || 0,
        hasMediCal,
      })
    )
  }

  return (
    <div className="grid gap-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex gap-2 pt-4 text-sm">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            These are estimates from general rules, not a benefits
            determination. Deductions and your county&apos;s rules can change
            the real number. Confirm with a worker before you decide. True Roof
            will not tell you to take or refuse a job.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your numbers</CardTitle>
          <CardDescription>
            Only fill in what applies to you. Leave the rest unchecked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="household-size">
                    People in your household
                  </FieldLabel>
                  <Input
                    id="household-size"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="current-income">
                    Current monthly income ($)
                  </FieldLabel>
                  <Input
                    id="current-income"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    required
                    value={currentIncome}
                    onChange={(e) => setCurrentIncome(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-income">
                    New monthly income ($)
                  </FieldLabel>
                  <Input
                    id="new-income"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    required
                    placeholder="A raise, a new job, or fewer hours"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                  />
                </Field>
              </Field>

              <FieldLabel htmlFor="has-voucher">
                <Field orientation="horizontal">
                  <Checkbox
                    id="has-voucher"
                    checked={hasVoucher}
                    onCheckedChange={(checked) =>
                      setHasVoucher(Boolean(checked))
                    }
                  />
                  <FieldContent>
                    <FieldTitle>I have a housing voucher</FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
              {hasVoucher ? (
                <Field className="pl-6">
                  <FieldLabel htmlFor="current-rent-share">
                    What you pay toward rent now ($/month)
                  </FieldLabel>
                  <Input
                    id="current-rent-share"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className="w-40"
                    value={currentRentShare}
                    onChange={(e) => setCurrentRentShare(e.target.value)}
                  />
                </Field>
              ) : null}

              <FieldLabel htmlFor="has-calfresh">
                <Field orientation="horizontal">
                  <Checkbox
                    id="has-calfresh"
                    checked={hasCalFresh}
                    onCheckedChange={(checked) =>
                      setHasCalFresh(Boolean(checked))
                    }
                  />
                  <FieldContent>
                    <FieldTitle>I get CalFresh</FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
              {hasCalFresh ? (
                <Field className="pl-6">
                  <FieldLabel htmlFor="current-calfresh">
                    Current monthly CalFresh benefit ($)
                  </FieldLabel>
                  <Input
                    id="current-calfresh"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className="w-40"
                    value={currentCalFreshBenefit}
                    onChange={(e) => setCurrentCalFreshBenefit(e.target.value)}
                  />
                </Field>
              ) : null}

              <FieldLabel htmlFor="has-medical">
                <Field orientation="horizontal">
                  <Checkbox
                    id="has-medical"
                    checked={hasMediCal}
                    onCheckedChange={(checked) =>
                      setHasMediCal(Boolean(checked))
                    }
                  />
                  <FieldContent>
                    <FieldTitle>I have Medi-Cal</FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>

              <Button type="submit" className="w-fit">
                See the before and after
                <IconArrowRight />
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {result ? <IncomeCheckResults result={result} /> : null}
    </div>
  )
}

function IncomeCheckResults({ result }: { result: IncomeCheckResult }) {
  const direction = result.incomeChange >= 0 ? "up" : "down"

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Income going {direction} by {money(Math.abs(result.incomeChange))}
            /month
          </CardTitle>
        </CardHeader>
      </Card>

      {result.rentShare ? (
        <Card>
          <CardHeader>
            <CardTitle>Housing voucher rent share</CardTitle>
            <CardDescription>
              Gradual. It moves with your income.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-lg font-medium">
            <span>{money(result.rentShare.before)}</span>
            <IconArrowRight className="size-4 text-muted-foreground" />
            <span>{money(result.rentShare.after)}</span>
          </CardContent>
        </Card>
      ) : null}

      {result.calFresh ? (
        <Card>
          <CardHeader>
            <CardTitle>CalFresh benefit</CardTitle>
            <CardDescription>
              Gradual. It moves with your income.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-lg font-medium">
            <span>{money(result.calFresh.before)}</span>
            <IconArrowRight className="size-4 text-muted-foreground" />
            <span>{money(result.calFresh.after)}</span>
          </CardContent>
        </Card>
      ) : null}

      {result.mediCal ? (
        <Card
          className={
            result.mediCal.wasUnder && !result.mediCal.isUnder
              ? "border-destructive/40 bg-destructive/5"
              : undefined
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Medi-Cal
              <Badge variant="outline">Cliff, not gradual</Badge>
            </CardTitle>
            <CardDescription>
              Estimated using the Medi-Cal expansion income limit for your
              household size ({money(result.mediCal.limit)}/year). Other
              Medi-Cal categories (disability, age, pregnancy) follow different
              rules this does not check.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.mediCal.wasUnder && !result.mediCal.isUnder ? (
              <p className="font-medium text-destructive">
                This income may put you over the Medi-Cal limit. Confirm before
                assuming you would lose coverage. Do not make this decision on
                this estimate alone.
              </p>
            ) : !result.mediCal.wasUnder && result.mediCal.isUnder ? (
              <p className="font-medium">
                This income looks like it would bring you back under the
                Medi-Cal limit.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Still on the same side of the limit either way, by this
                estimate.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Net change</CardTitle>
          <CardDescription>
            New income, minus the rent share increase, plus the CalFresh change.
            Does not include Medi-Cal, since losing coverage is not a dollar
            amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p
            className={
              result.netChange >= 0
                ? "text-lg font-semibold text-emerald-600"
                : "text-lg font-semibold text-destructive"
            }
          >
            {result.netChange >= 0 ? "+" : "-"}
            {money(Math.abs(result.netChange))}/month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
