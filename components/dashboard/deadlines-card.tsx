"use client"

import * as React from "react"
import { IconPlus, IconSparkles, IconTrash, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  checkDeadline,
  requiredRepeat,
  type DeadlineCheck,
  type DeadlineDraft,
} from "@/lib/obligations/deadline-rules"
import {
  isoDate,
  nextDueDate,
  parseLocalDate,
  repeatLabel,
} from "@/lib/obligations/recurrence"
import {
  deadlineCategoryLabel,
  programLabel,
  type Deadline,
  type DeadlineCategory,
  type ProgramKind,
  type Repeat,
} from "@/lib/obligations/types"

const REPEAT_CHOICES: (Repeat | null)[] = [
  null,
  { every: 1, unit: "week" },
  { every: 2, unit: "week" },
  { every: 1, unit: "month" },
  { every: 2, unit: "month" },
  { every: 3, unit: "month" },
  { every: 6, unit: "month" },
  { every: 1, unit: "year" },
]

function repeatKey(repeat: Repeat | null) {
  return repeat ? `${repeat.every}-${repeat.unit}` : "none"
}

function repeatFromKey(key: string): Repeat | null {
  if (key === "none") return null
  const [every, unit] = key.split("-")
  return { every: Number(every), unit: unit as Repeat["unit"] }
}

const categoryItems = (
  Object.keys(deadlineCategoryLabel) as DeadlineCategory[]
).map((value) => ({ value, label: deadlineCategoryLabel[value] }))

const programItems = (Object.keys(programLabel) as ProgramKind[]).map(
  (value) => ({
    value,
    label: programLabel[value],
  })
)

export const emptyDraft: DeadlineDraft = {
  title: "",
  category: "bill",
  program: null,
  firstDueDate: null,
  repeat: null,
  whatToBring: "",
}

function formatDay(iso: string) {
  const date = parseLocalDate(iso)
  return date
    ? date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : iso
}

export function DeadlinesCard({
  deadlines,
  completedIds,
  onAdd,
  onRemove,
}: {
  deadlines: Deadline[]
  completedIds: string[]
  onAdd: (deadline: Deadline) => void
  onRemove: (id: string) => void
}) {
  const today = isoDate(new Date())
  const completed = new Set(completedIds)
  const [adding, setAdding] = React.useState(false)

  const rows = deadlines
    .map((deadline) => ({
      deadline,
      next: nextDueDate(
        deadline.firstDueDate,
        deadline.repeat,
        today,
        (date) =>
          completed.has(`deadline-${deadline.id}-${date}`) ||
          Boolean(deadline.skippedDates?.includes(date))
      ),
    }))
    .sort((a, b) => (a.next ?? "9999").localeCompare(b.next ?? "9999"))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your deadlines</CardTitle>
        <CardDescription>
          Add each one once. If it repeats, the next date fills in on its own.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant={adding ? "secondary" : "default"}
            aria-expanded={adding}
            aria-controls="add-deadline-panel"
            onClick={() => setAdding((open) => !open)}
          >
            {adding ? <IconX /> : <IconPlus />}
            {adding ? "Close" : "Add a deadline"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6">
        {adding ? (
          <div id="add-deadline-panel" className="rounded-lg border p-4">
            <AddDeadlineForm
              today={today}
              onAdd={onAdd}
              onAdded={() => setAdding(false)}
            />
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className="grid gap-2">
            {rows.map(({ deadline, next }) => (
              <li key={deadline.id}>
                <Card
                  size="sm"
                  className="flex-row items-start justify-between gap-3 px-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary">
                      {next ? `Next: ${formatDay(next)}` : "Nothing left to do"}
                    </p>
                    <p className="font-medium">{deadline.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {repeatLabel(deadline.repeat)}
                      {deadline.whatToBring
                        ? `. Bring: ${deadline.whatToBring}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(deadline.id)}
                  >
                    <IconTrash />
                    <span className="sr-only">Remove {deadline.title}</span>
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}

        {rows.length === 0 && !adding ? (
          <p className="text-sm text-muted-foreground">
            No deadlines yet. Tap Add a deadline, or scan a letter in the
            Scanner tab.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

// Also used by the scanner, which passes what it read as `initial` and hides
// the sentence box.
export function AddDeadlineForm({
  today,
  onAdd,
  initial,
  showSentence = true,
  idPrefix = "deadline",
  onAdded,
}: {
  today: string
  onAdd: (deadline: Deadline) => void
  initial?: DeadlineCheck
  showSentence?: boolean
  idPrefix?: string
  // Called after a deadline is added, so a parent can close the form.
  onAdded?: () => void
}) {
  const [sentence, setSentence] = React.useState("")
  const [reading, setReading] = React.useState(false)
  const [draft, setDraft] = React.useState<DeadlineDraft>(
    initial?.draft ?? emptyDraft
  )
  const [notes, setNotes] = React.useState<string[]>(initial?.notes ?? [])
  const [problems, setProblems] = React.useState<string[]>(
    initial?.problems ?? []
  )
  const id = (name: string) => `${idPrefix}-${name}`

  function update(patch: Partial<DeadlineDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
    setProblems([])
  }

  async function handleRead() {
    setReading(true)
    try {
      const response = await fetch("/api/deadlines/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence, today }),
      })

      if (response.status === 503) {
        toast.error(
          "The reader is off right now. Fill in the boxes below yourself."
        )
        return
      }
      if (!response.ok) {
        toast.error("Could not read that. Fill in the boxes below yourself.")
        return
      }

      const result = (await response.json()) as DeadlineCheck
      setDraft(result.draft)
      setNotes(result.notes)
      setProblems(result.problems)
    } catch {
      toast.error("No connection. Fill in the boxes below yourself.")
    } finally {
      setReading(false)
    }
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Same rules as the reader, run again on whatever she edited.
    const result = checkDeadline(draft, today)
    if (result.problems.length > 0 || !result.draft.firstDueDate) {
      setDraft(result.draft)
      setProblems(result.problems)
      return
    }

    onAdd({
      id: crypto.randomUUID(),
      title: result.draft.title,
      category: result.draft.category,
      program: result.draft.program,
      firstDueDate: result.draft.firstDueDate,
      dueTime: result.draft.dueTime ?? null,
      repeat: result.draft.repeat,
      whatToBring: result.draft.whatToBring,
      createdAt: new Date().toISOString(),
    })
    toast.success(
      result.draft.repeat
        ? `Added. Repeats ${repeatLabel(result.draft.repeat).toLowerCase()}.`
        : "Added."
    )
    setSentence("")
    setDraft(emptyDraft)
    setNotes(result.notes)
    setProblems([])
    onAdded?.()
  }

  const locked = requiredRepeat(draft)
  const repeatChoices = REPEAT_CHOICES.some(
    (r) => repeatKey(r) === repeatKey(draft.repeat)
  )
    ? REPEAT_CHOICES
    : [...REPEAT_CHOICES, draft.repeat]
  const repeatItems = repeatChoices.map((r) => ({
    value: repeatKey(r),
    label: repeatLabel(r),
  }))

  return (
    <form onSubmit={handleSave}>
      <FieldGroup>
        {showSentence ? (
          <Field>
            <FieldLabel htmlFor={id("sentence")}>Add a deadline</FieldLabel>
            <Textarea
              id={id("sentence")}
              placeholder="CalFresh report due the 15th, bring my last 2 pay stubs"
              maxLength={400}
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
            />
            <FieldDescription>
              Type it the way you would say it, then tap Fill in for me. What
              you type is sent to our reader to fill the boxes below. It is not
              saved anywhere but this phone.
            </FieldDescription>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={!sentence.trim() || reading}
              onClick={handleRead}
            >
              <IconSparkles />
              {reading ? "Reading..." : "Fill in for me"}
            </Button>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor={id("title")}>What is it</FieldLabel>
          <Input
            id={id("title")}
            placeholder="Send CalFresh report"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </Field>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={id("category")}>Type</FieldLabel>
            <Select
              items={categoryItems}
              value={draft.category}
              onValueChange={(value) =>
                value && update({ category: value as DeadlineCategory })
              }
            >
              <SelectTrigger id={id("category")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {draft.category === "benefit_paperwork" ? (
            <Field>
              <FieldLabel htmlFor={id("program")}>Program</FieldLabel>
              <Select
                items={programItems}
                value={draft.program}
                onValueChange={(value) => {
                  const program = (value as ProgramKind | null) ?? null
                  const rule = requiredRepeat({
                    category: draft.category,
                    program,
                  })
                  update(rule ? { program, repeat: rule } : { program })
                }}
              >
                <SelectTrigger id={id("program")} className="w-full">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {programItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor={id("date")}>
              {draft.repeat ? "Next due date" : "Due date"}
            </FieldLabel>
            <Input
              id={id("date")}
              type="date"
              value={draft.firstDueDate ?? ""}
              onChange={(e) => update({ firstDueDate: e.target.value || null })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("time")}>Time (optional)</FieldLabel>
            <Input
              id={id("time")}
              type="time"
              value={draft.dueTime ?? ""}
              onChange={(e) => update({ dueTime: e.target.value || null })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("repeat")}>Repeats</FieldLabel>
            <Select
              items={repeatItems}
              value={repeatKey(draft.repeat)}
              disabled={Boolean(locked)}
              onValueChange={(value) =>
                value && update({ repeat: repeatFromKey(value) })
              }
            >
              <SelectTrigger id={id("repeat")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {locked && draft.program ? (
              <FieldDescription>
                Set by {programLabel[draft.program]} rules.
              </FieldDescription>
            ) : null}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={id("bring")}>
            What to bring or send (optional)
          </FieldLabel>
          <Input
            id={id("bring")}
            placeholder="Last 2 pay stubs"
            value={draft.whatToBring}
            onChange={(e) => update({ whatToBring: e.target.value })}
          />
        </Field>

        {notes.length > 0 || problems.length > 0 ? (
          <ul className="grid gap-1 text-sm" aria-live="polite">
            {notes.map((note) => (
              <li key={note} className="text-muted-foreground">
                {note}
              </li>
            ))}
            {problems.map((problem) => (
              <li key={problem} className="font-medium text-destructive">
                {problem}
              </li>
            ))}
          </ul>
        ) : null}

        <Button type="submit" className="w-fit">
          Add deadline
        </Button>
      </FieldGroup>
    </form>
  )
}
