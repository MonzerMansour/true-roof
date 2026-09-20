"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

const BILL_FREQUENCIES: BillFrequency[] = ["monthly", "every_2_months", "quarterly"]

const PROGRAM_ORDER: ProgramKind[] = [
  "calfresh",
  "medi_cal",
  "housing_voucher",
  "other",
]

function emptyProgramState(): Record<ProgramKind, ProgramState> {
  return {
    calfresh: { checked: false, date: "" },
    medi_cal: { checked: false, date: "" },
    housing_voucher: { checked: false, date: "" },
    other: { checked: false, date: "" },
  }
}

export function FinancialHelpForm() {
  const router = useRouter()

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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const rent = Number(rentAmount) || 0

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
      savingsSaved: loadProfile()?.savingsSaved ?? 0,
    }

    saveProfile(profile)
    toast.success("Your plan is set up.")
    router.push("/dashboard")
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-6">
        <Card>
          <CardHeader>
            <CardTitle>When you got housed</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="move-in-date">Move-in date</FieldLabel>
                <Input
                  id="move-in-date"
                  type="date"
                  required
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </Field>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="rent-amount">Rent</FieldLabel>
                  <Input
                    id="rent-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    required
                    placeholder="1450"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="rent-due-day">Due day of month</FieldLabel>
                  <Input
                    id="rent-due-day"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={28}
                    required
                    value={rentDueDay}
                    onChange={(e) => setRentDueDay(e.target.value)}
                  />
                </Field>
              </Field>
              <Field>
                <FieldLabel htmlFor="lease-end-date">
                  Lease end or renewal date
                </FieldLabel>
                <Input
                  id="lease-end-date"
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                />
                <FieldDescription>Optional. From your lease agreement.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="landlord-name">
                  Landlord or property manager
                </FieldLabel>
                <Input
                  id="landlord-name"
                  placeholder="Westgate Property Management"
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                />
                <FieldDescription>Optional. Shows up on your rent reminders.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programs you have</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldLegend variant="label">
                Check the ones that apply. True Roof suggests a recert/report
                date from your move-in date — edit it if you already know the
                real one from your award letter.
              </FieldLegend>
              {PROGRAM_ORDER.map((kind) => (
                <Field key={kind} orientation="responsive">
                  <FieldLabel htmlFor={`program-${kind}`} className="w-fit">
                    <Checkbox
                      id={`program-${kind}`}
                      checked={programs[kind].checked}
                      onCheckedChange={(checked) =>
                        checkProgram(kind, Boolean(checked))
                      }
                    />
                    {kind === "other" ? (
                      <Input
                        placeholder="Other program name"
                        value={otherLabel}
                        onChange={(e) => setOtherLabel(e.target.value)}
                        className="h-7 w-44"
                      />
                    ) : (
                      programLabel[kind]
                    )}
                  </FieldLabel>
                  {programs[kind].checked ? (
                    <Field>
                      <Input
                        type="date"
                        aria-label={`${programLabel[kind]} recert date`}
                        value={programs[kind].date}
                        onChange={(e) =>
                          updateProgram(kind, { date: e.target.value })
                        }
                      />
                      {programCadenceNote[kind] ? (
                        <FieldDescription>
                          {programCadenceNote[kind]}
                        </FieldDescription>
                      ) : null}
                    </Field>
                  ) : null}
                  {kind === "housing_voucher" && programs[kind].checked ? (
                    <Field>
                      <FieldLabel htmlFor="voucher-inspection-date">
                        Next unit inspection date
                      </FieldLabel>
                      <Input
                        id="voucher-inspection-date"
                        type="date"
                        value={voucherInspectionDate}
                        onChange={(e) => setVoucherInspectionDate(e.target.value)}
                      />
                      <FieldDescription>
                        Optional. Vouchers usually require a yearly inspection
                        to keep the unit passing.
                      </FieldDescription>
                    </Field>
                  ) : null}
                </Field>
              ))}
            </FieldSet>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utility bills to track</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
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
                size="sm"
                className="w-fit"
                onClick={addUtility}
              >
                <IconPlus />
                Add a bill
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case manager</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="case-manager-name">Name</FieldLabel>
                  <Input
                    id="case-manager-name"
                    placeholder="Optional"
                    value={caseManagerName}
                    onChange={(e) => setCaseManagerName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="case-manager-contact">
                    Phone or email
                  </FieldLabel>
                  <Input
                    id="case-manager-contact"
                    placeholder="Optional"
                    value={caseManagerContact}
                    onChange={(e) => setCaseManagerContact(e.target.value)}
                  />
                </Field>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full sm:w-fit">
          Set up my plan
        </Button>
      </FieldGroup>
    </form>
  )
}
