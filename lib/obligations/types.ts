export type ProgramKind = "calfresh" | "medi_cal" | "housing_voucher" | "other"

export const programLabel: Record<ProgramKind, string> = {
  calfresh: "CalFresh",
  medi_cal: "Medi-Cal",
  housing_voucher: "Housing voucher",
  other: "Other program",
}

export type Program = {
  kind: ProgramKind
  label: string
  nextRecertDate: string
}

export type RepeatUnit = "week" | "month" | "year"

// "Every 6 months" is { every: 6, unit: "month" }. Null means it happens once.
export type Repeat = { every: number; unit: RepeatUnit }

export type DeadlineCategory =
  | "rent"
  | "bill"
  | "benefit_paperwork"
  | "appointment"
  | "other"

export const deadlineCategoryLabel: Record<DeadlineCategory, string> = {
  rent: "Rent",
  bill: "Bill",
  benefit_paperwork: "Benefit paperwork",
  appointment: "Appointment",
  other: "Other",
}

// Entered once. Every later due date is calculated from `firstDueDate` and
// `repeat`, so nothing past the first date is ever stored.
export type Deadline = {
  id: string
  title: string
  category: DeadlineCategory
  program: ProgramKind | null
  firstDueDate: string
  // "HH:MM", 24 hour. Optional, and missing on deadlines saved before it existed.
  dueTime?: string | null
  repeat: Repeat | null
  whatToBring: string
  createdAt: string
  // Single dates deleted from a repeating deadline. The rest still repeat.
  skippedDates?: string[]
}

export type BillFrequency = "monthly" | "every_2_months" | "quarterly"

export const billFrequencyLabel: Record<BillFrequency, string> = {
  monthly: "Monthly",
  every_2_months: "Every 2 months",
  quarterly: "Every 3 months",
}

export const billFrequencyMonths: Record<BillFrequency, number> = {
  monthly: 1,
  every_2_months: 2,
  quarterly: 3,
}

export type Utility = {
  id: string
  name: string
  dueDay: number
  amount: number | null
  frequency: BillFrequency
}

export type ObligationsProfile = {
  moveInDate: string
  landlordName: string
  rentAmount: number
  rentDueDay: number
  leaseEndDate: string
  caseManagerName: string
  caseManagerContact: string
  programs: Program[]
  voucherInspectionDate: string
  utilities: Utility[]
  savingsGoal: number
  savingsSaved: number
  monthlyIncome: number | null
  previousMonthlyIncome: number | null
  incomeUpdatedAt: string | null
  lastShutoffNoticeAt: string | null
  lastCheckInAt: string | null
  lastCheckInFlaggedAt: string | null
  // Deadlines the person typed in once. Profiles saved before this field
  // existed do not have it, so read it as `profile.deadlines ?? []`.
  deadlines?: Deadline[]
}

export type Payment = {
  id: string
  loggedAt: string
  amount: number
  paidTo: string
  note: string
}

export type Occurrence = {
  id: string
  date: string
  title: string
  detail: string
  kind: "rent" | "utility" | "recert" | "lease" | "voucher_inspection" | "deadline"
  amount: number | null
  // "HH:MM" when the deadline has a time of day.
  time?: string | null
  // Set on items from a typed deadline, so the whole series can be removed.
  deadlineId?: string
  // True when that deadline repeats, so "delete all" means something.
  repeats?: boolean
}

export const emptyProfile: ObligationsProfile = {
  moveInDate: "",
  landlordName: "",
  rentAmount: 0,
  rentDueDay: 1,
  leaseEndDate: "",
  caseManagerName: "",
  caseManagerContact: "",
  programs: [],
  voucherInspectionDate: "",
  utilities: [],
  savingsGoal: 0,
  savingsSaved: 0,
  monthlyIncome: null,
  previousMonthlyIncome: null,
  incomeUpdatedAt: null,
  lastShutoffNoticeAt: null,
  lastCheckInAt: null,
  lastCheckInFlaggedAt: null,
  deadlines: [],
}
