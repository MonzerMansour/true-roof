"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronLeft,
  IconChecks,
  IconChevronRight,
  IconClock,
  IconLayoutGrid,
  IconLayoutList,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import {
  AddDeadlineForm,
  emptyDraft,
} from "@/components/dashboard/deadlines-card"
import {
  PanelDialog,
  ShowMoreDialog,
} from "@/components/dashboard/show-more-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "cn"
import { summarizeForList } from "@/lib/obligations/list-summary"
import { isoDate, parseLocalDate } from "@/lib/obligations/recurrence"
import type { Deadline, Occurrence } from "@/lib/obligations/types"

type Handlers = {
  onMarkDone: (occurrence: Occurrence) => void
  // Deletes every date of a typed deadline.
  onRemoveDeadline: (deadlineId: string) => void
  // Deletes just this one date of a typed deadline.
  onDeleteOne: (occurrence: Occurrence) => void
  // Opens the edit form for a typed deadline.
  onEditDeadline: (deadlineId: string) => void
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
  onMarkAllDone,
  onUndo,
  onRemoveDeadline,
  onDeleteOne,
  onEditDeadline,
  onAddDeadline,
}: Handlers & {
  occurrences: Occurrence[]
  done: Occurrence[]
  onMarkAllDone: (occurrences: Occurrence[]) => void
  onUndo: (occurrence: Occurrence) => void
  onAddDeadline: (deadline: Deadline) => void
}) {
  const [view, setView] = React.useState<"list" | "month">("list")
  const today = isoDate(new Date())
  const byDate = React.useMemo(() => groupByDate(occurrences), [occurrences])
  const doneByDate = React.useMemo(() => groupByDate(done), [done])

  if (occurrences.length === 0 && done.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        Nothing scheduled yet. Add a deadline above, or set up your plan in{" "}
        <Link
          href="/get-started/financial-help"
          className="font-medium underline"
        >
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
          <p className="text-base text-muted-foreground">
            Everything is done. Nice work.
          </p>
        ) : (
          <ListView
            occurrences={occurrences}
            today={today}
            onMarkDone={onMarkDone}
            onMarkAllDone={onMarkAllDone}
            onRemoveDeadline={onRemoveDeadline}
            onDeleteOne={onDeleteOne}
            onEditDeadline={onEditDeadline}
          />
        )
      ) : (
        <MonthCalendar
          byDate={byDate}
          doneByDate={doneByDate}
          today={today}
          onUndo={onUndo}
          onMarkDone={onMarkDone}
          onRemoveDeadline={onRemoveDeadline}
          onDeleteOne={onDeleteOne}
          onEditDeadline={onEditDeadline}
          onAddDeadline={onAddDeadline}
        />
      )}

      {done.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Done recently
          </p>
          <LimitedList
            title="Done recently"
            items={done}
            getKey={(occurrence) => occurrence.id}
            render={(occurrence) => (
              <DoneRow occurrence={occurrence} onUndo={onUndo} />
            )}
          />
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
  note,
  markAll,
  onMarkDone,
  onRemoveDeadline,
  onDeleteOne,
  onEditDeadline,
}: Handlers & {
  date: string
  today: string
  items: Occurrence[]
  note?: string
  markAll?: { count: number; onClick: () => void }
}) {
  const parsed = parseLocalDate(date)
  const label = relativeLabel(date, today)
  const overdue = date < today

  return (
    <Card
      className={cn("flex-row gap-4 px-4", overdue && "ring-destructive/40")}
    >
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

      <div className="min-w-0 flex-1">
        <ul className="divide-y">
          {items.map((occurrence) => (
            <li key={occurrence.id} className="py-2 first:pt-0 last:pb-0">
              <OccurrenceItem
                occurrence={occurrence}
                onMarkDone={onMarkDone}
                onRemoveDeadline={onRemoveDeadline}
                onDeleteOne={onDeleteOne}
                onEditDeadline={onEditDeadline}
              />
            </li>
          ))}
        </ul>
        {note || markAll ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-2">
            {note ? (
              <p className="text-sm text-muted-foreground">{note}</p>
            ) : null}
            {markAll ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={markAll.onClick}
              >
                <IconChecks />
                Mark all {markAll.count} done
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

// The list is the short version. Each group shows its most pressing few; the
// month calendar shows every date.
const LIST_LIMIT = 4

function LimitedList<T>({
  items,
  getKey,
  render,
  title,
}: {
  items: T[]
  getKey: (item: T) => string
  // `close` is set when the row is inside the "show more" panel.
  render: (item: T, close?: () => void) => React.ReactNode
  title: string
}) {
  const hidden = items.length - LIST_LIMIT

  return (
    <div className="grid gap-3">
      <ol className="grid gap-3">
        {items.slice(0, LIST_LIMIT).map((item) => (
          <li key={getKey(item)}>{render(item)}</li>
        ))}
      </ol>
      {hidden > 0 ? (
        <ShowMoreDialog
          label={`Show ${hidden} more`}
          title={`${title} (${items.length})`}
        >
          {(close) => (
            <ol className="grid gap-3">
              {items.map((item) => (
                <li key={getKey(item)}>{render(item, close)}</li>
              ))}
            </ol>
          )}
        </ShowMoreDialog>
      ) : null}
    </div>
  )
}

function ListView({
  occurrences,
  today,
  onMarkDone,
  onMarkAllDone,
  onRemoveDeadline,
  onDeleteOne,
  onEditDeadline,
}: Handlers & {
  occurrences: Occurrence[]
  today: string
  onMarkAllDone: (occurrences: Occurrence[]) => void
}) {
  const { oneTime, recurring } = React.useMemo(
    () => summarizeForList(occurrences, today),
    [occurrences, today]
  )

  return (
    <div className="grid gap-6">
      <section aria-labelledby="list-one-time" className="grid gap-3">
        <h3
          id="list-one-time"
          className="text-sm font-medium text-muted-foreground"
        >
          One-time ({oneTime.length})
        </h3>
        {oneTime.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing one-time is waiting.
          </p>
        ) : (
          <LimitedList
            title="One-time"
            items={oneTime}
            getKey={(o) => o.id}
            render={(o, close) => (
              <DayGroup
                date={o.date}
                today={today}
                items={[o]}
                onMarkDone={onMarkDone}
                onRemoveDeadline={onRemoveDeadline}
                onDeleteOne={onDeleteOne}
                onEditDeadline={(id) => {
                  close?.()
                  onEditDeadline(id)
                }}
              />
            )}
          />
        )}
      </section>

      <section aria-labelledby="list-repeating" className="grid gap-3">
        <h3
          id="list-repeating"
          className="text-sm font-medium text-muted-foreground"
        >
          Repeating ({recurring.length})
        </h3>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing repeating is waiting.
          </p>
        ) : (
          <LimitedList
            title="Repeating"
            items={recurring}
            getKey={(g) => g.seriesId}
            render={(group, close) => {
              const missed = group.overdue.length
              const later =
                missed > 0 ? group.upcomingCount : group.upcomingCount - 1
              const note =
                missed > 1
                  ? `${missed} dates missed so far. The month view shows each one.`
                  : later > 0
                    ? `${later} more ${later === 1 ? "date" : "dates"} after this one.`
                    : undefined

              return (
                <DayGroup
                  date={group.next.date}
                  today={today}
                  items={[group.next]}
                  note={note}
                  markAll={
                    missed > 1
                      ? {
                          count: missed,
                          onClick: () => onMarkAllDone(group.overdue),
                        }
                      : undefined
                  }
                  onMarkDone={onMarkDone}
                  onRemoveDeadline={onRemoveDeadline}
                  onDeleteOne={onDeleteOne}
                  onEditDeadline={(id) => {
                    close?.()
                    onEditDeadline(id)
                  }}
                />
              )
            }}
          />
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        This list shows what needs you first. The month view shows every date.
      </p>
    </div>
  )
}

function OccurrenceItem({
  occurrence,
  onMarkDone,
  onRemoveDeadline,
  onDeleteOne,
  onEditDeadline,
}: Handlers & { occurrence: Occurrence }) {
  const deadlineId = occurrence.deadlineId

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-base font-medium [overflow-wrap:anywhere]">
          {occurrence.title}
        </p>
        {occurrence.time ? (
          <p className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
            <IconClock className="size-3.5" />
            {formatTime(occurrence.time)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {deadlineId ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEditDeadline(deadlineId)}
            >
              <IconPencil />
              <span className="sr-only">Edit {occurrence.title}</span>
            </Button>
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
                <span className="sr-only">
                  : delete every date of {occurrence.title}
                </span>
              </Button>
            ) : null}
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onMarkDone(occurrence)}
        >
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
        <p className="font-medium text-muted-foreground line-through [overflow-wrap:anywhere]">
          {occurrence.title}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onUndo(occurrence)}
      >
        <IconArrowBackUp />
        Undo
        <span className="sr-only">
          : move {occurrence.title} back to your list
        </span>
      </Button>
    </Card>
  )
}

function MonthCalendar({
  byDate,
  doneByDate,
  today,
  onUndo,
  onMarkDone,
  onRemoveDeadline,
  onDeleteOne,
  onEditDeadline,
  onAddDeadline,
}: Handlers & {
  byDate: Map<string, Occurrence[]>
  // Items already marked done, by the date they were due.
  doneByDate: Map<string, Occurrence[]>
  today: string
  onUndo: (occurrence: Occurrence) => void
  onAddDeadline: (deadline: Deadline) => void
}) {
  const now = new Date()
  const [cursor, setCursor] = React.useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  )
  const [selected, setSelected] = React.useState(today)
  const [adding, setAdding] = React.useState(false)
  // A tap on a day opens that day in a panel, so nobody has to scroll below
  // the grid to find it.
  const [open, setOpen] = React.useState(false)

  const cells = React.useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(firstOfMonth)
    start.setDate(start.getDate() - firstOfMonth.getDay())
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0
    ).getDate()
    // Only as many weeks as this month needs.
    const weeksNeeded = Math.ceil((firstOfMonth.getDay() + daysInMonth) / 7)

    return Array.from({ length: weeksNeeded * 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return {
        date,
        iso: isoDate(date),
        inMonth: date.getMonth() === cursor.getMonth(),
      }
    })
  }, [cursor])

  const selectedItems = byDate.get(selected) ?? []
  const selectedDone = doneByDate.get(selected) ?? []
  const selectedDate = parseLocalDate(selected)

  function selectDay(iso: string) {
    setSelected(iso)
    setAdding(false)
  }

  function openDay(iso: string) {
    selectDay(iso)
    setOpen(true)
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-xl font-medium">
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
              setCursor(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
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
            onClick={() =>
              setCursor(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
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
          const doneItems = doneByDate.get(iso) ?? []
          const isSelected = iso === selected
          const overdue = iso < today

          return (
            <button
              key={iso}
              type="button"
              onClick={() => openDay(iso)}
              aria-haspopup="dialog"
              aria-label={
                date.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }) +
                (items.length > 0 ? `, ${items.length} due` : "") +
                (doneItems.length > 0 ? `, ${doneItems.length} done` : "")
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
                  iso === today &&
                    "bg-primary font-semibold text-primary-foreground"
                )}
              >
                {date.getDate()}
              </span>

              {items.length > 0 || doneItems.length > 0 ? (
                <>
                  {/* Phones: a count. The cells are too narrow for titles. */}
                  <span
                    className={cn(
                      "self-center rounded-full px-1.5 text-xs font-semibold sm:hidden",
                      items.length === 0
                        ? "bg-muted text-muted-foreground"
                        : overdue
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                    )}
                  >
                    {items.length > 0 ? items.length : `✓${doneItems.length}`}
                  </span>
                  {/* Wider screens: calendar-style chips with time and title. */}
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {[...items, ...doneItems]
                      .slice(0, CHIPS_PER_DAY)
                      .map((item) => {
                        const finished = doneItems.includes(item)
                        return (
                          <span
                            key={item.id}
                            className={cn(
                              "truncate rounded-md px-1.5 py-0.5 text-xs",
                              finished
                                ? "bg-muted text-muted-foreground line-through"
                                : overdue
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-primary/10 text-foreground"
                            )}
                          >
                            {item.time ? (
                              <span className="font-semibold">
                                {formatTime(item.time)}{" "}
                              </span>
                            ) : null}
                            {item.title}
                          </span>
                        )
                      })}
                    {items.length + doneItems.length > CHIPS_PER_DAY ? (
                      <span className="px-1.5 text-xs text-muted-foreground">
                        +{items.length + doneItems.length - CHIPS_PER_DAY} more
                      </span>
                    ) : null}
                  </span>
                </>
              ) : null}
            </button>
          )
        })}
      </div>

      <PanelDialog
        open={open}
        onOpenChange={setOpen}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {selectedDate?.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year:
                selectedDate.getFullYear() === now.getFullYear()
                  ? undefined
                  : "numeric",
            })}
            {selectedItems.length > 0 && selected < today ? (
              <Badge variant="destructive">Overdue</Badge>
            ) : null}
          </span>
        }
      >
        <div className="grid gap-4">
          <Button
            type="button"
            size="sm"
            variant={adding ? "secondary" : "outline"}
            className="w-fit"
            aria-expanded={adding}
            onClick={() => setAdding((isAdding) => !isAdding)}
          >
            {adding ? <IconX /> : <IconPlus />}
            {adding ? "Close" : "Add a deadline on this day"}
          </Button>

          {adding ? (
            <AddDeadlineForm
              key={selected}
              today={today}
              onAdd={onAddDeadline}
              onAdded={() => setAdding(false)}
              initial={{
                draft: { ...emptyDraft, firstDueDate: selected },
                notes: [],
                problems: [],
              }}
              idPrefix="day"
            />
          ) : null}

          {selectedItems.length === 0 && selectedDone.length === 0 ? (
            adding ? null : (
              <p className="text-base text-muted-foreground">
                Nothing due this day.
              </p>
            )
          ) : null}

          {selectedItems.length > 0 ? (
            <section aria-label="Still to do" className="grid gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {selected < today ? "Not done yet" : "Due"} (
                {selectedItems.length})
              </h3>
              <ul className="divide-y">
                {selectedItems.map((occurrence) => (
                  <li key={occurrence.id} className="py-2 first:pt-0 last:pb-0">
                    <OccurrenceItem
                      occurrence={occurrence}
                      onMarkDone={onMarkDone}
                      onRemoveDeadline={onRemoveDeadline}
                      onDeleteOne={onDeleteOne}
                      onEditDeadline={(id) => {
                        setOpen(false)
                        onEditDeadline(id)
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {selectedDone.length > 0 ? (
            <section aria-label="Done" className="grid gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Done ({selectedDone.length})
              </h3>
              <ul className="grid gap-2">
                {selectedDone.map((occurrence) => (
                  <li key={occurrence.id}>
                    <DoneRow occurrence={occurrence} onUndo={onUndo} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </PanelDialog>
    </div>
  )
}
