"use client"

import * as React from "react"
import Link from "next/link"
import { IconArrowLeft, IconArrowRight, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
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
import {
  formatTime,
  householdLabel,
  idLabel,
  latestEntryLabel,
  latestEntryOptions,
  partnerRoomsLabel,
  petLabel,
  stayLabel,
  stayOptions,
  vehicleLabel,
  vehicleRegisteredLabel,
  vehicleSizeLabel,
  type Household,
  type IdStatus,
  type PartnerRooms,
  type PetNeed,
  type SeekerNeeds,
  type VehicleNeed,
  type VehicleRegistered,
  type VehicleSize,
} from "@/lib/matching/needs"
import {
  clearDraft,
  clearNeeds,
  loadDraft,
  loadNeeds,
  saveDraft,
  saveNeeds,
} from "@/lib/matching/storage"

type Draft = {
  household: Household | null
  partnerRooms: PartnerRooms | null
  pet: PetNeed | null
  petWeightLbs: string
  idStatus: IdStatus | null
  vehicle: VehicleNeed | null
  vehicleSize: VehicleSize | null
  vehicleRegistered: VehicleRegistered | null
  arrivalFrom: string
  arrivalTo: string
  latestEntry: string | null | undefined
  daysNeeded: number | null
}

const emptyDraft: Draft = {
  household: null,
  partnerRooms: null,
  pet: null,
  petWeightLbs: "",
  idStatus: null,
  vehicle: null,
  vehicleSize: null,
  vehicleRegistered: null,
  arrivalFrom: "17:00",
  arrivalTo: "20:00",
  latestEntry: undefined,
  daysNeeded: null,
}

type StepId =
  | "household"
  | "partnerRooms"
  | "pet"
  | "petWeight"
  | "id"
  | "vehicle"
  | "vehicleDetails"
  | "arrival"
  | "curfew"
  | "stay"

// Follow-up questions only appear when an earlier answer needs them.
function visibleSteps(draft: Draft): StepId[] {
  const steps: StepId[] = ["household"]
  if (draft.household === "with_partner") steps.push("partnerRooms")
  steps.push("pet")
  if (draft.pet === "small_pet") steps.push("petWeight")
  steps.push("id", "vehicle")
  if (draft.vehicle === "car" || draft.vehicle === "rv_van") {
    steps.push("vehicleDetails")
  }
  steps.push("arrival", "curfew", "stay")
  return steps
}

function isAnswered(step: StepId, draft: Draft) {
  switch (step) {
    case "household":
      return draft.household !== null
    case "partnerRooms":
      return draft.partnerRooms !== null
    case "pet":
      return draft.pet !== null
    case "petWeight":
      return true
    case "id":
      return draft.idStatus !== null
    case "vehicle":
      return draft.vehicle !== null
    case "vehicleDetails":
      return draft.vehicleSize !== null && draft.vehicleRegistered !== null
    case "arrival":
      return Boolean(draft.arrivalFrom && draft.arrivalTo)
    case "curfew":
      return draft.latestEntry !== undefined
    case "stay":
      return draft.daysNeeded !== null
  }
}

// A message when an answer is filled in but cannot be used. Null when fine.
function stepError(step: StepId, draft: Draft): string | null {
  if (step === "petWeight" && draft.petWeightLbs.trim()) {
    const weight = Number(draft.petWeightLbs)
    if (!Number.isFinite(weight) || weight < 1 || weight > 200) {
      return "Enter a weight from 1 to 200 pounds, or leave it empty."
    }
  }

  if (step === "arrival" && draft.arrivalFrom && draft.arrivalTo) {
    if (draft.arrivalFrom >= draft.arrivalTo) {
      return "The latest time must be after the earliest time. If any time works, tap Any time."
    }
  }

  return null
}

const arrivalPresets = [
  { label: "Any time", from: "00:00", to: "23:59" },
  { label: "Daytime, 9 AM to 5 PM", from: "09:00", to: "17:00" },
  { label: "Evening, 5 PM to 9 PM", from: "17:00", to: "21:00" },
]

function toNeeds(draft: Draft): SeekerNeeds | null {
  if (
    !draft.household ||
    !draft.pet ||
    !draft.idStatus ||
    !draft.vehicle ||
    draft.latestEntry === undefined ||
    draft.daysNeeded === null
  ) {
    return null
  }

  const weight = Number(draft.petWeightLbs)
  const hasVehicle = draft.vehicle !== "none"

  return {
    household: draft.household,
    partnerRooms: draft.household === "with_partner" ? draft.partnerRooms : null,
    pet: draft.pet,
    petWeightLbs:
      draft.pet === "small_pet" && weight > 0 ? weight : null,
    idStatus: draft.idStatus,
    vehicle: draft.vehicle,
    vehicleSize: hasVehicle ? draft.vehicleSize : null,
    vehicleRegistered: hasVehicle ? draft.vehicleRegistered : null,
    arrivalFrom: draft.arrivalFrom,
    arrivalTo: draft.arrivalTo,
    latestEntry: draft.latestEntry,
    daysNeeded: draft.daysNeeded,
  }
}

function fromNeeds(needs: SeekerNeeds): Draft {
  return {
    household: needs.household,
    partnerRooms: needs.partnerRooms,
    pet: needs.pet,
    petWeightLbs: needs.petWeightLbs ? String(needs.petWeightLbs) : "",
    idStatus: needs.idStatus,
    vehicle: needs.vehicle,
    vehicleSize: needs.vehicleSize,
    vehicleRegistered: needs.vehicleRegistered,
    arrivalFrom: needs.arrivalFrom,
    arrivalTo: needs.arrivalTo,
    latestEntry: needs.latestEntry,
    daysNeeded: needs.daysNeeded,
  }
}

type Choice = { value: string; title: string; note?: string }

function ChoiceGroup({
  legend,
  hint,
  value,
  choices,
  onChange,
}: {
  legend: string
  hint?: string
  value: string | null
  choices: Choice[]
  onChange: (value: string) => void
}) {
  return (
    <FieldSet>
      <FieldLegend className="font-heading font-semibold data-[variant=legend]:text-2xl">
        {legend}
      </FieldLegend>
      {hint ? <FieldDescription className="text-base">{hint}</FieldDescription> : null}
      <RadioGroup
        value={value ?? ""}
        onValueChange={(next) => onChange(String(next))}
      >
        {choices.map((choice) => (
          <FieldLabel key={choice.value} htmlFor={`${legend}-${choice.value}`}>
            <Field orientation="horizontal" className="min-h-14 items-center has-[>[data-slot=field-content]]:items-center">
              <RadioGroupItem
                id={`${legend}-${choice.value}`}
                value={choice.value}
              />
              <FieldContent>
                <FieldTitle className="text-base">{choice.title}</FieldTitle>
                {choice.note ? (
                  <FieldDescription>{choice.note}</FieldDescription>
                ) : null}
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

function entries<T extends string>(labels: Record<T, string>): Choice[] {
  return (Object.keys(labels) as T[]).map((key) => ({
    value: key,
    title: labels[key],
  }))
}

export function FindAPlaceForm() {
  const [draft, setDraft] = React.useState<Draft>(emptyDraft)
  const [index, setIndex] = React.useState(0)
  const [saved, setSaved] = React.useState<SeekerNeeds | null>(null)
  const [ready, setReady] = React.useState(false)
  const [synced, setSynced] = React.useState(false)
  // Changing one answer: only that question (plus any follow-up it newly
  // needs) is shown, then the person lands back on their answers.
  const [editing, setEditing] = React.useState<{
    stepId: StepId
    before: StepId[]
    pos: number
  } | null>(null)
  const [resumed, setResumed] = React.useState(false)
  const headingRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const existing = loadNeeds()
    if (existing) {
      setDraft(fromNeeds(existing))
      setSaved(existing)
    } else {
      const stored = loadDraft()
      if (stored) {
        setDraft({ ...emptyDraft, ...(stored.draft as Partial<Draft>) })
        setIndex(Math.max(0, stored.index))
        setResumed(stored.index > 0)
      }
    }
    setReady(true)
  }, [])

  // Keep progress on this phone so a refresh or a dropped connection does not
  // send anyone back to question one.
  React.useEffect(() => {
    if (!ready || saved || editing) return
    saveDraft({ draft, index })
  }, [ready, saved, editing, draft, index])

  const allSteps = visibleSteps(draft)
  const steps = editing
    ? [
        editing.stepId,
        ...allSteps.filter(
          (id) => id !== editing.stepId && !editing.before.includes(id)
        ),
      ]
    : allSteps
  const position = editing ? editing.pos : index
  const step = steps[Math.min(position, steps.length - 1)]
  const isLast = position >= steps.length - 1
  const error = stepError(step, draft)
  const answered = isAnswered(step, draft)
  const canContinue = answered && !error

  function patch(next: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...next }))
  }

  function go(to: number) {
    if (editing) {
      setEditing({ ...editing, pos: to })
    } else {
      setIndex(to)
    }
    requestAnimationFrame(() => {
      headingRef.current?.focus()
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    })
  }

  function onNext() {
    if (!canContinue) return

    if (!isLast) {
      go(position + 1)
      return
    }

    const needs = toNeeds(draft)
    if (!needs) return

    saveNeeds(needs)
    clearDraft()
    setResumed(false)
    setSaved(needs)
    setEditing(null)
    setSynced(false)
    toast.success("Saved on this phone.")

    // Signed-in accounts also keep a copy that helps match places. Guests get
    // a 401 here and stay phone-only.
    fetch("/api/needs/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(needs),
    })
      .then((response) => response.json())
      .then((result: { stored?: boolean }) => setSynced(Boolean(result.stored)))
      .catch(() => setSynced(false))
  }

  function startOver() {
    clearNeeds()
    setResumed(false)
    setDraft(emptyDraft)
    setSaved(null)
    setIndex(0)
  }

  if (!ready) return null

  if (saved && !editing) {
    return (
      <Summary
        needs={saved}
        synced={synced}
        onEditStep={(stepId) => {
          setEditing({ stepId, before: visibleSteps(draft), pos: 0 })
          requestAnimationFrame(() => headingRef.current?.focus())
        }}
        onRedo={() => {
          setSaved(null)
          setIndex(0)
        }}
        onClear={startOver}
      />
    )
  }

  return (
    <form
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
          {editing
            ? "Changing an answer"
            : `Question ${position + 1} of ${steps.length}`}
        </p>
      </div>
      {!editing ? (
        <Progress
          className="mt-2"
          aria-label={`Question ${position + 1} of ${steps.length}`}
          value={position + 1}
          max={steps.length}
        />
      ) : null}

      {resumed && !editing ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border p-3 text-sm">
          <span>You are back where you left off.</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={startOver}
          >
            Start over
          </Button>
        </p>
      ) : null}

      <FieldGroup className="mt-4 gap-6">
        {step === "household" ? (
          <ChoiceGroup
            legend="Who needs a place?"
            value={draft.household}
            choices={entries(householdLabel)}
            onChange={(value) => {
              const household = value as Household
              patch({
                household,
                partnerRooms: household === "alone" ? null : draft.partnerRooms,
              })
            }}
          />
        ) : null}

        {step === "partnerRooms" ? (
          <ChoiceGroup
            legend="Do you need to stay in the same room?"
            hint="Some shelters do not take couples, or put partners in separate rooms."
            value={draft.partnerRooms}
            choices={entries(partnerRoomsLabel)}
            onChange={(value) => patch({ partnerRooms: value as PartnerRooms })}
          />
        ) : null}

        {step === "pet" ? (
          <ChoiceGroup
            legend="Do you have a pet with you?"
            value={draft.pet}
            choices={[
              { value: "none", title: petLabel.none },
              {
                value: "service_animal",
                title: petLabel.service_animal,
                note: "A trained animal that helps with a disability.",
              },
              { value: "small_pet", title: petLabel.small_pet },
              { value: "larger_pet", title: petLabel.larger_pet },
            ]}
            onChange={(value) => patch({ pet: value as PetNeed })}
          />
        ) : null}

        {step === "petWeight" ? (
          <Field>
            <FieldLabel
              htmlFor="pet-weight"
              className="font-heading text-2xl font-semibold"
            >
              About how much does your pet weigh?
            </FieldLabel>
            <FieldDescription className="text-base">
              Some shelters take small pets under a weight limit. A guess is
              fine. You can skip this.
            </FieldDescription>
            <div className="flex items-center gap-2">
              <Input
                id="pet-weight"
                type="number"
                inputMode="numeric"
                min={1}
                max={200}
                className="h-12 w-28 text-base"
                value={draft.petWeightLbs}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "pet-weight-error" : undefined}
                onChange={(e) => patch({ petWeightLbs: e.target.value })}
              />
              <span className="text-base">pounds</span>
            </div>
            {error ? <FieldError id="pet-weight-error">{error}</FieldError> : null}
          </Field>
        ) : null}

        {step === "id" ? (
          <ChoiceGroup
            legend="Do you have a photo ID?"
            hint="Some shelters ask for one. Others do not, or decide case by case."
            value={draft.idStatus}
            choices={entries(idLabel)}
            onChange={(value) => patch({ idStatus: value as IdStatus })}
          />
        ) : null}

        {step === "vehicle" ? (
          <ChoiceGroup
            legend="Do you have a vehicle you sleep in or need to park?"
            hint="If you do, True Roof shows shelters and safe parking lots together."
            value={draft.vehicle}
            choices={entries(vehicleLabel)}
            onChange={(value) => {
              const vehicle = value as VehicleNeed
              patch(
                vehicle === "none"
                  ? { vehicle, vehicleSize: null, vehicleRegistered: null }
                  : { vehicle }
              )
            }}
          />
        ) : null}

        {step === "vehicleDetails" ? (
          <>
            <ChoiceGroup
              legend="How big is it?"
              value={draft.vehicleSize}
              choices={entries(vehicleSizeLabel)}
              onChange={(value) => patch({ vehicleSize: value as VehicleSize })}
            />
            <ChoiceGroup
              legend="Is it registered and running?"
              hint="Many safe parking lots ask for this."
              value={draft.vehicleRegistered}
              choices={entries(vehicleRegisteredLabel)}
              onChange={(value) =>
                patch({ vehicleRegistered: value as VehicleRegistered })
              }
            />
          </>
        ) : null}

        {step === "arrival" ? (
          <FieldSet>
            <FieldLegend className="font-heading font-semibold data-[variant=legend]:text-2xl">
              When can you get there to check in?
            </FieldLegend>
            <FieldDescription className="text-base">
              Shelters only take new people during set hours. Give the earliest
              and latest time you can arrive.
            </FieldDescription>
            <div className="flex flex-wrap gap-2">
              {arrivalPresets.map((preset) => {
                const active =
                  draft.arrivalFrom === preset.from &&
                  draft.arrivalTo === preset.to

                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={active ? "default" : "outline"}
                    aria-pressed={active}
                    onClick={() =>
                      patch({ arrivalFrom: preset.from, arrivalTo: preset.to })
                    }
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <Field className="w-auto">
                <FieldLabel htmlFor="arrival-from">Earliest</FieldLabel>
                <Input
                  id="arrival-from"
                  type="time"
                  required
                  className="h-12 text-base"
                  value={draft.arrivalFrom}
                  onChange={(e) => patch({ arrivalFrom: e.target.value })}
                />
              </Field>
              <Field className="w-auto">
                <FieldLabel htmlFor="arrival-to">Latest</FieldLabel>
                <Input
                  id="arrival-to"
                  type="time"
                  required
                  className="h-12 text-base"
                  value={draft.arrivalTo}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "arrival-error" : undefined}
                  onChange={(e) => patch({ arrivalTo: e.target.value })}
                />
              </Field>
            </div>
            {error ? <FieldError id="arrival-error">{error}</FieldError> : null}
          </FieldSet>
        ) : null}

        {step === "curfew" ? (
          <ChoiceGroup
            legend="Do you need to come in late at night?"
            hint="Most shelters lock the doors at a set time. Pick the latest you need to be let in, for example if you work nights."
            value={
              draft.latestEntry === undefined
                ? null
                : (draft.latestEntry ?? "none")
            }
            choices={latestEntryOptions.map((option) => ({
              value: option.value ?? "none",
              title: option.label,
            }))}
            onChange={(value) =>
              patch({ latestEntry: value === "none" ? null : value })
            }
          />
        ) : null}

        {step === "stay" ? (
          <ChoiceGroup
            legend="How long do you need a bed?"
            hint="Shelters set a longest stay. A rough answer is fine."
            value={draft.daysNeeded === null ? null : String(draft.daysNeeded)}
            choices={stayOptions.map((option) => ({
              value: String(option.days),
              title: option.label,
            }))}
            onChange={(value) => patch({ daysNeeded: Number(value) })}
          />
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
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => {
              if (saved) setDraft(fromNeeds(saved))
              setEditing(null)
            }}
          >
            Cancel
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
              {editing ? "Save change" : "Save my answers"}
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
        {answered ? "" : "Choose an answer to continue."}
      </p>
    </form>
  )
}

function Summary({
  needs,
  synced,
  onEditStep,
  onRedo,
  onClear,
}: {
  needs: SeekerNeeds
  synced: boolean
  onEditStep: (step: StepId) => void
  onRedo: () => void
  onClear: () => void
}) {
  const rows: [string, string, StepId][] = [
    ["Who", householdLabel[needs.household], "household"],
  ]

  if (needs.partnerRooms) {
    rows.push(["Rooms", partnerRoomsLabel[needs.partnerRooms], "partnerRooms"])
  }

  rows.push(["Pet", petLabel[needs.pet], "pet"])

  if (needs.pet === "small_pet") {
    rows.push([
      "Pet weight",
      needs.petWeightLbs ? `About ${needs.petWeightLbs} pounds` : "Not given",
      "petWeight",
    ])
  }

  rows.push(["Photo ID", idLabel[needs.idStatus], "id"])
  rows.push(["Vehicle", vehicleLabel[needs.vehicle], "vehicle"])

  if (needs.vehicleSize) {
    rows.push(["Vehicle size", vehicleSizeLabel[needs.vehicleSize], "vehicleDetails"])
  }
  if (needs.vehicleRegistered) {
    rows.push([
      "Registered",
      vehicleRegisteredLabel[needs.vehicleRegistered],
      "vehicleDetails",
    ])
  }

  rows.push([
    "Can check in",
    `${formatTime(needs.arrivalFrom)} to ${formatTime(needs.arrivalTo)}`,
    "arrival",
  ])
  rows.push(["Late entry", latestEntryLabel(needs.latestEntry), "curfew"])
  rows.push(["Bed needed", stayLabel(needs.daysNeeded), "stay"])

  return (
    <div className="max-w-xl">
      <h2 className="font-heading text-2xl font-semibold">Your answers</h2>
      <p className="mt-2 text-muted-foreground">
        {synced
          ? "Saved on this phone and to your account, so True Roof can match you to places. Nothing is sent to a shelter."
          : "Saved on this phone. Nothing is sent to a shelter."}{" "}
        Matching to real shelters and parking lots is still being built.
      </p>

      <dl className="mt-6 divide-y rounded-lg border">
        {rows.map(([label, value, stepId]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="flex flex-col gap-0.5">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEditStep(stepId)}
            >
              Change
              <span className="sr-only"> {label}</span>
            </Button>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" variant="outline" onClick={onRedo}>
          Answer everything again
        </Button>
        <Button size="lg" variant="outline" onClick={onClear}>
          Delete my answers
        </Button>
        <Link
          href="/get-started"
          className={buttonVariants({ size: "lg", variant: "ghost" })}
        >
          Back
        </Link>
      </div>
    </div>
  )
}
