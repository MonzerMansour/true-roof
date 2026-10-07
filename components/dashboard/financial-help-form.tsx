"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { programCadenceNote, suggestRecertDate } from "@/lib/obligations/program-rules"
import { loadProfile, saveProfile } from "@/lib/obligations/storage"
import {
  billFrequencyLabel,
  programLabel,
  type BillFrequency,
  type ObligationsProfile,
  type ProgramKind,
} from "@/lib/obligations/types"

type ProgramState = { checked: boolean; date: string }
type UtilityFormState = {
  id: string
  name: string
  dueDay: string
  amount: string
  frequency: BillFrequency
}

type StepId =
  | "moveIn"
  | "rent"
  | "landlord"
  | "lease"
  | "programs"
  | "programDates"
  | "utilities"
  | "income"
  | "caseManager"

const BILL_FREQUENCIES: BillFrequency[] = ["monthly", "every_2_months", "quarterly"]

const PROGRAM_ORDER: ProgramKind[] = [
  "calfresh",
  "medi_cal",
  "housing_voucher",
  "other",
]

const REQUIRED_STEPS: StepId[] = ["moveIn", "rent"]

function emptyProgramState(): Record<ProgramKind, ProgramState> {
  return {
    calfresh: { checked: false, date: "" },
    medi_cal: { checked: false, date: "" },
    housing_voucher: { checked: false, date: "" },
    other: { checked: false, date: "" },
  }
}

function validDay(value: string) {
  const day = Number(value)
  return Number.isInteger(day) && day >= 1 && day <= 28
}

function Question({
  legend,
  hint,
  children,
}: {
  legend: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <FieldSet>
      <FieldLegend className="font-heading font-semibold data-[variant=legend]:text-2xl">
        {legend}
      </FieldLegend>
      {hint ? <FieldDescription className="text-base">{hint}</FieldDescription> : null}
      {children}
    </FieldSet>
  )
}

export function FinancialHelpForm() {
  const router = useRouter()
  const headingRef = React.useRef<HTMLDivElement>(null)

  const [index, setIndex] = React.useState(0)
  const [moveInDate, setMoveInDate] = React.useState("")
  const [landlordName, setLandlordName] = React.useState("")
  const [rentAmount, setRentAmount] = React.useState("")
  const [rentDueDay, setRentDueDay] = React.useState("1")
  const [leaseEndDate, setLeaseEndDate] = React.useState("")
  const [caseManagerName, setCaseManagerName] = React.useState("")
  const [caseManagerContact, setCaseManagerContact] = React.useState("")
  const [programs, setPrograms] = React.useState(emptyProgramState())
  const [voucherInspectionDate, setVoucherInspectionDate] = React.useState("")
  const [otherLabel, setOtherLabel] = React.useState("")
  const [utilities, setUtilities] = React.useState<UtilityFormState[]>([])
  const [monthlyIncome, setMonthlyIncome] = React.useState("")

  React.useEffect(() => {
    const existing = loadProfile()
    if (!existing) return

    setMoveInDate(existing.moveInDate ?? "")
    setLandlordName(existing.landlordName ?? "")
    setRentAmount(existing.rentAmount ? String(existing.rentAmount) : "")
    setRentDueDay(existing.rentDueDay ? String(existing.rentDueDay) : "1")
    setLeaseEndDate(existing.leaseEndDate ?? "")
    setCaseManagerName(existing.caseManagerName ?? "")
    setCaseManagerContact(existing.caseManagerContact ?? "")
    setVoucherInspectionDate(existing.voucherInspectionDate ?? "")
    setMonthlyIncome(
      existing.monthlyIncome != null ? String(existing.monthlyIncome) : ""
    )
    setUtilities(
      existing.utilities.map((u) => ({
        id: u.id,
        name: u.name,
        dueDay: String(u.dueDay),
        amount: u.amount != null ? String(u.amount) : "",
        frequency: u.frequency ?? "monthly",
      }))
    )

    const nextPrograms = emptyProgramState()
    for (const program of existing.programs) {
      nextPrograms[program.kind] = {
        checked: true,
        date: program.nextRecertDate ?? "",
      }
      if (program.kind === "other") setOtherLabel(program.label)
    }
    setPrograms(nextPrograms)
  }, [])

  function updateProgram(kind: ProgramKind, patch: Partial<ProgramState>) {
    setPrograms((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }))
  }

  function checkProgram(kind: ProgramKind, checked: boolean) {
    setPrograms((prev) => {
      const current = prev[kind]
      const shouldSuggest = checked && !current.date && moveInDate
      return {
        ...prev,
        [kind]: {
          checked,
          date: shouldSuggest ? suggestRecertDate(kind, moveInDate) : current.date,
        },
      }
    })
  }

  React.useEffect(() => {
    if (!moveInDate) return

    setPrograms((prev) => {
      let changed = false
      const next = { ...prev }

      for (const kind of PROGRAM_ORDER) {
        if (next[kind].checked && !next[kind].date) {
          const suggested = suggestRecertDate(kind, moveInDate)
          if (suggested) {
            next[kind] = { ...next[kind], date: suggested }
            changed = true
          }
        }
      }

      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveInDate])

  function addUtility() {
    setUtilities((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        dueDay: "1",
        amount: "",
        frequency: "monthly",
      },
    ])
  }

  function updateUtility(id: string, patch: Partial<UtilityFormState>) {
    setUtilities((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    )
  }

  function removeUtility(id: string) {
    setUtilities((prev) => prev.filter((u) => u.id !== id))
  }

  // Follow-up questions only appear when an earlier answer needs them.
  const anyProgram = PROGRAM_ORDER.some((kind) => programs[kind].checked)
  const steps: StepId[] = [
    "moveIn",
    "rent",
    "landlord",
    "lease",
    "programs",
    ...(anyProgram ? (["programDates"] as StepId[]) : []),
    "utilities",
    "income",
    "caseManager",
  ]
  const position = Math.min(index, steps.length - 1)
  const step = steps[position]
  const isLast = position === steps.length - 1
  const isRequired = REQUIRED_STEPS.includes(step)

  let answered = true
  let error: string | null = null

  if (step === "moveIn") {
    answered = Boolean(moveInDate)
  }

  if (step === "rent") {
    answered = Number(rentAmount) > 0 && validDay(rentDueDay)
    if (rentAmount !== "" && !(Number(rentAmount) > 0)) {
      error = "Enter your monthly rent as a number above zero."
    } else if (!validDay(rentDueDay)) {
      error = "Pick a due day from 1 to 28."
    }
  }

  if (step === "utilities") {
    if (utilities.some((u) => u.name.trim() && !validDay(u.dueDay))) {
      error = "Each bill needs a due day from 1 to 28."
    } else if (utilities.some((u) => u.amount !== "" && Number(u.amount) < 0)) {
      error = "A bill amount cannot be negative."
    }
  }

  const canContinue = answered && !error

  function go(to: number) {
    setIndex(to)
    requestAnimationFrame(() => {
      headingRef.current?.focus()
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    })
  }

  function finish() {
    const rent = Number(rentAmount) || 0
    const existing = loadProfile()

    const profile: ObligationsProfile = {
      moveInDate,
      landlordName,
      rentAmount: rent,
      rentDueDay: Number(rentDueDay) || 1,
      leaseEndDate,
      caseManagerName,
      caseManagerContact,
      programs: PROGRAM_ORDER.filter((kind) => programs[kind].checked).map(
        (kind) => ({
          kind,
          label: kind === "other" && otherLabel ? otherLabel : programLabel[kind],
          nextRecertDate: programs[kind].date,
        })
      ),
      voucherInspectionDate: programs.housing_voucher.checked
        ? voucherInspectionDate
        : "",
      utilities: utilities
        .filter((u) => u.name.trim())
        .map((u) => ({
          id: u.id,
          name: u.name.trim(),
          dueDay: Number(u.dueDay) || 1,
          amount: u.amount ? Number(u.amount) : null,
          frequency: u.frequency,
        })),
      savingsGoal: rent,
      savingsSaved: existing?.savingsSaved ?? 0,
      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : null,
      // A change made here is a correction, not a "my income changed" event,
      // that only happens through the dedicated update action on Financials,
      // so the drop-detection baseline carries over untouched.
      previousMonthlyIncome: existing?.previousMonthlyIncome ?? null,
      incomeUpdatedAt: existing?.incomeUpdatedAt ?? null,
      lastShutoffNoticeAt: existing?.lastShutoffNoticeAt ?? null,
      lastCheckInAt: existing?.lastCheckInAt ?? null,
      deadlines: existing?.deadlines ?? [],
    }

    saveProfile(profile)
    toast.success("Your plan is set up.")
    router.push("/financials")
  }

  function onNext() {
    if (!canContinue) return

    if (!isLast) {
      go(position + 1)
      return
    }

    finish()
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
      className="max-w-xl"
    >
      <div
        ref={headingRef}
        tabIndex={-1}
        className="outline-none"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-muted-foreground">
          Question {position + 1} of {steps.length}
        </p>
      </div>
      <Progress
        className="mt-2"
        aria-label={`Question ${position + 1} of ${steps.length}`}
        value={position + 1}
        max={steps.length}
      />

      <FieldGroup className="mt-4 gap-6">
        {step === "moveIn" ? (
          <Question
            legend="When did you move in?"
            hint="The day you got your keys. True Roof uses it to write your deadlines."
          >
            <Input
              id="move-in-date"
              type="date"
              aria-label="Move-in date"
              className="h-12 w-full text-base sm:w-64"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </Question>
        ) : null}

        {step === "rent" ? (
          <Question
            legend="How much is your rent, and when is it due?"
            hint="What you pay each month, and the day of the month it is due."
          >
            <div className="flex flex-wrap gap-4">
              <Field className="w-40">
                <FieldLabel htmlFor="rent-amount">Monthly rent ($)</FieldLabel>
                <Input
                  id="rent-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="1450"
                  className="h-12 text-base"
                  aria-invalid={Boolean(error)}
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                />
              </Field>
              <Field className="w-40">
                <FieldLabel htmlFor="rent-due-day">Due day of month</FieldLabel>
                <Input
                  id="rent-due-day"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={28}
                  className="h-12 text-base"
                  aria-invalid={Boolean(error)}
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                />
              </Field>
            </div>
            {error ? <FieldError>{error}</FieldError> : null}
          </Question>
        ) : null}

        {step === "landlord" ? (
          <Question
            legend="Who do you pay rent to?"
            hint="Your landlord or property manager. It shows up on your rent reminders."
          >
            <Input
              id="landlord-name"
              aria-label="Landlord or property manager"
              placeholder="Westgate Property Management"
              className="h-12 text-base"
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
            />
          </Question>
        ) : null}

        {step === "lease" ? (
          <Question
            legend="When does your lease end or renew?"
            hint="You can find it in your lease agreement."
          >
            <Input
              id="lease-end-date"
              type="date"
              aria-label="Lease end or renewal date"
              className="h-12 w-full text-base sm:w-64"
              value={leaseEndDate}
              onChange={(e) => setLeaseEndDate(e.target.value)}
            />
          </Question>
        ) : null}

        {step === "programs" ? (
          <Question
            legend="Do you get any of these programs?"
            hint="Check all that apply, or none. True Roof suggests a recert or report date for each one."
          >
            <div className="grid w-full gap-2">
              {PROGRAM_ORDER.map((kind) => (
                <FieldLabel key={kind} htmlFor={`program-${kind}`}>
                  <Field
                    orientation="horizontal"
                    className="min-h-14 items-center has-[>[data-slot=field-content]]:items-center"
                  >
                    <Checkbox
                      id={`program-${kind}`}
                      checked={programs[kind].checked}
                      onCheckedChange={(checked) =>
                        checkProgram(kind, Boolean(checked))
                      }
                    />
                    <FieldContent>
                      <FieldTitle className="text-base">
                        {kind === "other" ? "Another program" : programLabel[kind]}
                      </FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </div>
            {programs.other.checked ? (
              <Input
                aria-label="Name of the other program"
                placeholder="Name of the program"
                className="h-12 text-base"
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
              />
            ) : null}
          </Question>
        ) : null}

        {step === "programDates" ? (
          <Question
            legend="Check your program dates"
            hint="These are estimates from your move-in date. If your award letter says a different date, change it."
          >
            {PROGRAM_ORDER.filter((kind) => programs[kind].checked).map((kind) => (
              <Field key={kind}>
                <FieldLabel htmlFor={`program-date-${kind}`}>
                  {kind === "other" ? otherLabel || "Other program" : programLabel[kind]}
                  {": next recert or report date"}
                </FieldLabel>
                <Input
                  id={`program-date-${kind}`}
                  type="date"
                  className="h-12 w-full text-base sm:w-64"
                  value={programs[kind].date}
                  onChange={(e) => updateProgram(kind, { date: e.target.value })}
                />
                {programCadenceNote[kind] ? (
                  <FieldDescription>{programCadenceNote[kind]}</FieldDescription>
                ) : null}
              </Field>
            ))}
            {programs.housing_voucher.checked ? (
              <Field>
                <FieldLabel htmlFor="voucher-inspection-date">
                  Housing voucher: next unit inspection date
                </FieldLabel>
                <Input
                  id="voucher-inspection-date"
                  type="date"
                  className="h-12 w-full text-base sm:w-64"
                  value={voucherInspectionDate}
                  onChange={(e) => setVoucherInspectionDate(e.target.value)}
                />
                <FieldDescription>
                  Vouchers usually require a yearly inspection to keep the unit
                  passing.
                </FieldDescription>
              </Field>
            ) : null}
          </Question>
        ) : null}

        {step === "utilities" ? (
          <Question
            legend="Any bills you want reminders for?"
            hint="Electric, water, gas, internet. Add as many as you like."
          >
            {utilities.map((utility) => (
              <div key={utility.id} className="rounded-lg border p-3">
                <FieldGroup className="gap-3">
                  <Field orientation="responsive">
                    <Field>
                      <FieldLabel htmlFor={`utility-name-${utility.id}`}>
                        Bill name
                      </FieldLabel>
                      <Input
                        id={`utility-name-${utility.id}`}
                        placeholder="Electric"
                        value={utility.name}
                        onChange={(e) =>
                          updateUtility(utility.id, { name: e.target.value })
                        }
                      />
                    </Field>
                    <Field orientation="horizontal" className="w-fit items-end gap-2">
                      <Field>
                        <FieldLabel htmlFor={`utility-amount-${utility.id}`}>
                          Amount ($)
                        </FieldLabel>
                        <Input
                          id={`utility-amount-${utility.id}`}
                          type="number"
                          min={0}
                          inputMode="decimal"
                          placeholder="85"
                          className="w-24"
                          value={utility.amount}
                          onChange={(e) =>
                            updateUtility(utility.id, { amount: e.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`utility-due-day-${utility.id}`}>
                          Due day of month
                        </FieldLabel>
                        <Input
                          id={`utility-due-day-${utility.id}`}
                          type="number"
                          min={1}
                          max={28}
                          className="w-20"
                          value={utility.dueDay}
                          onChange={(e) =>
                            updateUtility(utility.id, { dueDay: e.target.value })
                          }
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove bill"
                        onClick={() => removeUtility(utility.id)}
                      >
                        <IconTrash />
                      </Button>
                    </Field>
                  </Field>

                  <RadioGroup
                    value={utility.frequency}
                    onValueChange={(value) =>
                      updateUtility(utility.id, {
                        frequency: value as BillFrequency,
                      })
                    }
                    className="flex flex-row flex-wrap gap-4"
                  >
                    {BILL_FREQUENCIES.map((frequency) => (
                      <FieldLabel
                        key={frequency}
                        className="w-fit text-sm font-normal"
                      >
                        <RadioGroupItem value={frequency} />
                        {billFrequencyLabel[frequency]}
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                </FieldGroup>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={addUtility}
            >
              <IconPlus />
              Add a bill
            </Button>
            {error ? <FieldError>{error}</FieldError> : null}
          </Question>
        ) : null}

        {step === "income" ? (
          <Question
            legend="What's your monthly income?"
            hint="Optional. Helps True Roof flag it if your income drops later."
          >
            <Field className="w-40">
              <FieldLabel htmlFor="monthly-income">
                Monthly income ($)
              </FieldLabel>
              <Input
                id="monthly-income"
                type="number"
                inputMode="decimal"
                min={0}
                className="h-12 text-base"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
            </Field>
          </Question>
        ) : null}

        {step === "caseManager" ? (
          <Question
            legend="Do you have a case manager?"
            hint="So you can reach them fast if something slips."
          >
            <div className="flex flex-wrap gap-4">
              <Field className="w-full sm:w-56">
                <FieldLabel htmlFor="case-manager-name">Name</FieldLabel>
                <Input
                  id="case-manager-name"
                  className="h-12 text-base"
                  value={caseManagerName}
                  onChange={(e) => setCaseManagerName(e.target.value)}
                />
              </Field>
              <Field className="w-full sm:w-56">
                <FieldLabel htmlFor="case-manager-contact">
                  Phone or email
                </FieldLabel>
                <Input
                  id="case-manager-contact"
                  className="h-12 text-base"
                  value={caseManagerContact}
                  onChange={(e) => setCaseManagerContact(e.target.value)}
                />
              </Field>
            </div>
          </Question>
        ) : null}
      </FieldGroup>

      <div className="mt-8 flex gap-3">
        {position > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => go(position - 1)}
          >
            <IconArrowLeft />
            Back
          </Button>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="flex-1 sm:flex-none"
          disabled={!canContinue}
        >
          {isLast ? (
            <>
              <IconCheck />
              Set up my plan
            </>
          ) : (
            <>
              Next
              <IconArrowRight />
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {error
          ? ""
          : !answered
            ? "Fill this in to continue."
            : isRequired
              ? ""
              : "Optional. You can skip this one."}
      </p>
    </form>
  )
}
