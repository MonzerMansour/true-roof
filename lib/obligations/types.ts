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
  kind: "rent" | "utility" | "recert" | "lease" | "voucher_inspection"
  amount: number | null
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
}
