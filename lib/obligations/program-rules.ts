import type { ProgramKind } from "./types"

export const programCadenceMonths: Partial<Record<ProgramKind, number>> = {
  calfresh: 6,
  medi_cal: 12,
  housing_voucher: 12,
}

export const programCadenceNote: Partial<Record<ProgramKind, string>> = {
  calfresh: "Estimate: CalFresh usually requires a report every 6 months.",
  medi_cal: "Estimate: Medi-Cal usually renews every 12 months.",
  housing_voucher: "Estimate: housing vouchers usually have a yearly income review.",
}

export function suggestRecertDate(kind: ProgramKind, moveInDate: string): string {
  const months = programCadenceMonths[kind]
  if (!months || !moveInDate) return ""

  const [year, month, day] = moveInDate.split("-").map(Number)
  if (!year || !month || !day) return ""

  const date = new Date(year, month - 1 + months, day)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
