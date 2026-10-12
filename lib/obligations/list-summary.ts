import type { Occurrence } from "./types"

// One repeating item (rent, a bill, a weekly deadline) boiled down to a single
// row. The month calendar still shows every date; the list shows this.
export type RecurringGroup = {
  seriesId: string
  // The date that matters now: the overdue one that has waited longest, or
  // the next one coming up.
  next: Occurrence
  // Every overdue date of this item, oldest first.
  overdue: Occurrence[]
  // Dates still to come after the overdue ones.
  upcomingCount: number
}

export type ListSummary = {
  // Dates that happen once. Oldest first, so overdue ones lead.
  oneTime: Occurrence[]
  recurring: RecurringGroup[]
}

export function summarizeForList(
  occurrences: Occurrence[],
  today: string
): ListSummary {
  const sorted = [...occurrences].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "")
  )

  const oneTime: Occurrence[] = []
  const series = new Map<string, Occurrence[]>()

  for (const occurrence of sorted) {
    if (occurrence.recurring && occurrence.seriesId) {
      const items = series.get(occurrence.seriesId) ?? []
      items.push(occurrence)
      series.set(occurrence.seriesId, items)
    } else {
      oneTime.push(occurrence)
    }
  }

  const recurring = [...series.entries()]
    .map(([seriesId, items]): RecurringGroup => {
      const overdue = items.filter((o) => o.date < today)
      return {
        seriesId,
        next: items[0],
        overdue,
        upcomingCount: items.length - overdue.length,
      }
    })
    .sort(
      (a, b) =>
        a.next.date.localeCompare(b.next.date) ||
        a.next.title.localeCompare(b.next.title)
    )

  return { oneTime, recurring }
}
