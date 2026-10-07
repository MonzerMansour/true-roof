// Rough, general-rule estimates only, not a benefits determination.
// Real amounts depend on deductions, household composition, and county
// rules that only a caseworker's system actually has. Every function here
// is a simplification of a real federal formula, kept because it is at
// least the correct general rule, not because it is precise.

// 2024 HHS federal poverty guideline, 48 contiguous states + DC.
const FPL_BASE_HOUSEHOLD_OF_ONE = 15060
const FPL_PER_ADDITIONAL_PERSON = 5380

// The ACA Medicaid expansion adult eligibility line (used by Medi-Cal for
// MAGI-based adult coverage). Other Medi-Cal categories (disability, aged,
// pregnancy) use different rules this does not check.
const MEDI_CAL_FPL_PERCENT = 1.38

// A Housing Choice Voucher household generally pays about 30% of adjusted
// monthly income toward rent (24 CFR 5.628).
const VOUCHER_RENT_SHARE_RATE = 0.3

// CalFresh (SNAP) benefits generally shrink by about 30 cents per $1 of net
// income gained, and grow by about 30 cents per $1 of net income lost.
const CALFRESH_BENEFIT_REDUCTION_RATE = 0.3

export function federalPovertyLevel(householdSize: number): number {
  const size = Math.max(1, Math.round(householdSize))
  return FPL_BASE_HOUSEHOLD_OF_ONE + (size - 1) * FPL_PER_ADDITIONAL_PERSON
}

export function estimateRentShare(
  currentRentShare: number,
  incomeChange: number
): number {
  return Math.max(0, currentRentShare + incomeChange * VOUCHER_RENT_SHARE_RATE)
}

export function estimateCalFreshBenefit(
  currentBenefit: number,
  incomeChange: number
): number {
  return Math.max(
    0,
    currentBenefit - incomeChange * CALFRESH_BENEFIT_REDUCTION_RATE
  )
}

export function medicalIncomeLimit(householdSize: number): number {
  return federalPovertyLevel(householdSize) * MEDI_CAL_FPL_PERCENT
}

export function isUnderMediCalLimit(
  annualIncome: number,
  householdSize: number
): boolean {
  return annualIncome <= medicalIncomeLimit(householdSize)
}

export type IncomeCheckInput = {
  householdSize: number
  currentMonthlyIncome: number
  newMonthlyIncome: number
  hasVoucher: boolean
  currentRentShare: number
  hasCalFresh: boolean
  currentCalFreshBenefit: number
  hasMediCal: boolean
}

export type IncomeCheckResult = {
  incomeChange: number
  rentShare: { before: number; after: number } | null
  calFresh: { before: number; after: number } | null
  mediCal: {
    wasUnder: boolean
    isUnder: boolean
    limit: number
  } | null
  netChange: number
}

export function runIncomeCheck(input: IncomeCheckInput): IncomeCheckResult {
  const incomeChange = input.newMonthlyIncome - input.currentMonthlyIncome

  const rentShare = input.hasVoucher
    ? {
        before: input.currentRentShare,
        after: estimateRentShare(input.currentRentShare, incomeChange),
      }
    : null

  const calFresh = input.hasCalFresh
    ? {
        before: input.currentCalFreshBenefit,
        after: estimateCalFreshBenefit(input.currentCalFreshBenefit, incomeChange),
      }
    : null

  const mediCal = input.hasMediCal
    ? {
        wasUnder: isUnderMediCalLimit(
          input.currentMonthlyIncome * 12,
          input.householdSize
        ),
        isUnder: isUnderMediCalLimit(
          input.newMonthlyIncome * 12,
          input.householdSize
        ),
        limit: medicalIncomeLimit(input.householdSize),
      }
    : null

  const rentShareChange = rentShare ? rentShare.after - rentShare.before : 0
  const calFreshChange = calFresh ? calFresh.after - calFresh.before : 0
  const netChange = incomeChange - rentShareChange + calFreshChange

  return { incomeChange, rentShare, calFresh, mediCal, netChange }
}
