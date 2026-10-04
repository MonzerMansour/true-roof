"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconLayoutGrid,
  IconLayoutList,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import { AddDeadlineForm, emptyDraft } from "@/components/dashboard/deadlines-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "cn"
import { isoDate, parseLocalDate } from "@/lib/obligations/recurrence"
import type { Deadline, Occurrence } from "@/lib/obligations/types"

type Handlers = {
  onMarkDone: (occurrence: Occurrence) => void
  // Deletes every date of a typed deadline.
  onRemoveDeadline: (deadlineId: string) => void
  // Deletes just this one date of a typed deadline.
  onDeleteOne: (occurrence: Occurrence) => void
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
// Month cells show this many items, then "+N more".
const CHIPS_PER_DAY = 2

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function groupByDate(occurrences: Occurrence[]) {
  const map = new Map<string, Occurrence[]>()
  for (const occurrence of occurrences) {
    const list = map.get(occurrence.date) ?? []
    list.push(occurrence)
    map.set(occurrence.date, list)
  }
  return map
}

function relativeLabel(date: string, today: string) {
  if (date < today) return "Overdue"
  if (date === today) return "Today"
  const tomorrow = parseLocalDate(today)
  if (tomorrow) {
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date === isoDate(tomorrow)) return "Tomorrow"
  }
  return null
}

export function CalendarTab({
  occurrences,
  done,
  onMarkDone,
  onUndo,
  onRemoveDeadline,
  onDeleteOne,
  onAddDeadline,
}: Handlers & {
  occurrences: Occurrence[]
  done: Occurrence[]
  onUndo: (occurrence: Occurrence) => void
  onAddDeadline: (deadline: Deadline) => void
}) {
  const [view, setView] = React.useState<"list" | "month">("list")
  const today = isoDate(new Date())
  const byDate = React.useMemo(() => groupByDate(occurrences), [occurrences])

  if (occurrences.length === 0 && done.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        Nothing scheduled yet. Add a deadline above, or set up your plan in{" "}
        <Link href="/get-started/financial-help" className="font-medium underline">
          Financials setup
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-[3px]">
        <Button
          type="button"
          variant={view === "list" ? "default" : "ghost"}
          size="sm"
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          <IconLayoutList />
          List
        </Button>
        <Button
          type="button"
          variant={view === "month" ? "default" : "ghost"}
          size="sm"
          aria-pressed={view === "month"}
          onClick={() => setView("month")}
        >
          <IconLayoutGrid />
          Month
        </Button>
      </div>

      {view === "list" ? (
        occurrences.length === 0 ? (
          <p className="text-base text-muted-foreground">Everything is done. Nice work.</p>
        ) : (
          <ol className="grid gap-3">
            {[...byDate.entries()].map(([date, items]) => (
              <li key={date}>
                <DayGroup
                  date={date}
                  today={today}
                  items={items}
                  onMarkDone={onMarkDone}
                  onRemoveDeadline={onRemoveDeadline}
                  onDeleteOne={onDeleteOne}
                />
              </li>
            ))}
          </ol>
        )
      ) : (
        <MonthCalendar
          byDate={byDate}
          today={today}
          onMarkDone={onMarkDone}
          onRemoveDeadline={onRemoveDeadline}
          onDeleteOne={onDeleteOne}
          onAddDeadline={onAddDeadline}
        />
      )}

      {done.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted-foreground">Done recently</p>
          <ul className="grid gap-2">
            {done.map((occurrence) => (
              <li key={occurrence.id}>
                <DoneRow occurrence={occurrence} onUndo={onUndo} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

// One panel per day: a big date on the left, everything due that day on the
// right.
function DayGroup({
  date,
  today,
  items,
  onMarkDone,
  onRemoveDeadline,
  onDeleteOne,
}: Handlers & { date: string; today: string; items: Occurrence[] }) {
  const parsed = parseLocalDate(date)
  const label = relativeLabel(date, today)
  const overdue = date < today

  return (
    <Card className={cn("flex-row gap-4 px-4", overdue && "ring-destructive/40")}>
      <div
        className={cn(
          "flex w-16 shrink-0 flex-col items-center justify-start text-center",
          overdue ? "text-destructive" : date === today ? "text-primary" : ""
        )}
      >
        <span className="text-sm font-medium uppercase">
          {parsed?.toLocaleDateString(undefined, { weekday: "short" })}
        </span>
        <span className="font-heading text-3xl leading-none font-semibold">
          {parsed?.getDate()}
        </span>
        <span className="text-sm">
          {parsed?.toLocaleDateString(undefined, { month: "short" })}
          {parsed && parsed.getFullYear() !== new Date().getFullYear()
            ? ` ${parsed.getFullYear()}`
            : ""}
        </span>
        {label ? (
          <span className="mt-1 text-xs font-semibold">{label}</span>
        ) : null}
      </div>

      <ul className="min-w-0 flex-1 divide-y">
        {items.map((occurrence) => (
          <li key={occurrence.id} className="py-2 first:pt-0 last:pb-0">
            <OccurrenceItem
              occurrence={occurrence}
              onMarkDone={onMarkDone}
              onRemoveDeadline={onRemoveDeadline}
              onDeleteOne={onDeleteOne}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function OccurrenceItem({
  occurrence,
  onMarkDone,
  onRemoveDeadline,
  onDeleteOne,
}: Handlers & { occurrence: Occurrence }) {
  const deadlineId = occurrence.deadlineId

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-base font-medium">{occurrence.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {occurrence.time ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <IconClock className="size-3.5" />
              {formatTime(occurrence.time)}
            </span>
          ) : null}
          <span>{occurrence.detail}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {deadlineId ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDeleteOne(occurrence)}
            >
              <IconTrash />
              <span className="sr-only">
                {occurrence.repeats
                  ? `Delete ${occurrence.title} on this date only`
                  : `Delete ${occurrence.title}`}
              </span>
            </Button>
            {occurrence.repeats ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto flex-col gap-0 px-1.5 py-0.5 text-[10px] leading-tight font-semibold"
                onClick={() => onRemoveDeadline(deadlineId)}
              >
                <IconTrash className="size-4" />
                All
                <span className="sr-only">: delete every date of {occurrence.title}</span>
              </Button>
            ) : null}
          </>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => onMarkDone(occurrence)}>
          <IconCheck />
          Mark done
        </Button>
      </div>
    </div>
  )
}

function DoneRow({
  occurrence,
  onUndo,
}: {
  occurrence: Occurrence
  onUndo: (occurrence: Occurrence) => void
}) {
  const parsed = parseLocalDate(occurrence.date)
  return (
    <Card className="flex-row items-center justify-between gap-3 px-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          {parsed?.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="font-medium text-muted-foreground line-through">{occurrence.title}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onUndo(occurrence)}>
        <IconArrowBackUp />
        Undo
        <span className="sr-only">: move {occurrence.title} back to your list</span>
      </Button>
    </Card>
  )
}

function MonthCalendar({
  byDate,
  today,
  onMarkDone,
  onRemoveDeadline,
  onDeleteOne,
  onAddDeadline,
}: Handlers & {
  byDate: Map<string, Occurrence[]>
  today: string
  onAddDeadline: (deadline: Deadline) => void
}) {
  const now = new Date()
  const [cursor, setCursor] = React.useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  )
  const [selected, setSelected] = React.useState(today)
  const [adding, setAdding] = React.useState(false)

  const cells = React.useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(firstOfMonth)
    start.setDate(start.getDate() - firstOfMonth.getDay())
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    // Only as many weeks as this month needs.
    const weeksNeeded = Math.ceil((firstOfMonth.getDay() + daysInMonth) / 7)

    return Array.from({ length: weeksNeeded * 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return { date, iso: isoDate(date), inMonth: date.getMonth() === cursor.getMonth() }
    })
  }, [cursor])

  const selectedItems = byDate.get(selected) ?? []
  const selectedDate = parseLocalDate(selected)

  function selectDay(iso: string) {
    setSelected(iso)
    setAdding(false)
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-xl font-medium">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          >
            <IconChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
              selectDay(today)
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          >
            <IconChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground sm:text-sm">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, iso, inMonth }) => {
          const items = byDate.get(iso) ?? []
          const isSelected = iso === selected
          const overdue = iso < today

          return (
            <button
              key={iso}
              type="button"
              onClick={() => selectDay(iso)}
              aria-label={
                date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) +
                (items.length > 0 ? `, ${items.length} due` : "")
              }
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-stretch gap-1 rounded-lg border p-1 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-28 sm:p-1.5",
                inMonth ? "bg-card" : "bg-muted text-muted-foreground/60",
                isSelected && "border-primary ring-2 ring-primary/40"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center self-center rounded-full sm:self-start",
                  iso === today && "bg-primary font-semibold text-primary-foreground"
                )}
              >
                {date.getDate()}
              </span>

              {items.length > 0 ? (
                <>
                  {/* Phones: a count. The cells are too narrow for titles. */}
                  <span
                    className={cn(
                      "self-center rounded-full px-1.5 text-xs font-semibold sm:hidden",
                      overdue ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                    )}
                  >
                    {items.length}
                  </span>
                  {/* Wider screens: calendar-style chips with time and title. */}
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {items.slice(0, CHIPS_PER_DAY).map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          "truncate rounded-md px-1.5 py-0.5 text-xs",
                          overdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-foreground"
                        )}
                      >
                        {item.time ? (
                          <span className="font-semibold">{formatTime(item.time)} </span>
                        ) : null}
                        {item.title}
                      </span>
                    ))}
                    {items.length > CHIPS_PER_DAY ? (
                      <span className="px-1.5 text-xs text-muted-foreground">
                        +{items.length - CHIPS_PER_DAY} more
                      </span>
                    ) : null}
                  </span>
                </>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 rounded-lg border p-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-lg font-medium">
            {selectedDate?.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <Button
            type="button"
            size="sm"
            variant={adding ? "secondary" : "outline"}
            aria-expanded={adding}
            onClick={() => setAdding((open) => !open)}
          >
            {adding ? <IconX /> : <IconPlus />}
            {adding ? "Close" : "Add a deadline on this day"}
          </Button>
        </div>

        {adding ? (
          <AddDeadlineForm
            key={selected}
            today={today}
            onAdd={onAddDeadline}
            onAdded={() => setAdding(false)}
            initial={{ draft: { ...emptyDraft, firstDueDate: selected }, notes: [], problems: [] }}
            idPrefix="day"
          />
        ) : null}

        {selectedItems.length === 0 ? (
          adding ? null : <p className="text-base text-muted-foreground">Nothing due this day.</p>
        ) : (
          <ul className="divide-y">
            {selectedItems.map((occurrence) => (
              <li key={occurrence.id} className="py-2 first:pt-0 last:pb-0">
                <OccurrenceItem
                  occurrence={occurrence}
                  onMarkDone={onMarkDone}
                  onRemoveDeadline={onRemoveDeadline}
                  onDeleteOne={onDeleteOne}
                />
              </li>
            ))}
          </ul>
        )}
        {selectedItems.length > 0 && selected < today ? (
          <Badge variant="destructive" className="w-fit">
            Overdue
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
