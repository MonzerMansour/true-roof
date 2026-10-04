// Where a listing's facts came from, and which facts that source publishes
// at all.
//
// This is how True Roof tells "nobody has filled this in yet" apart from "the
// source that gave us this row does not publish this field". Both are null in
// the database. Only the source tells you which one it is.
//
// Nothing here is guessed. If a source does not publish a field, the column
// stays null and the person is told to call. We never infer a policy.
//
// This file must not import lib/listings/types.ts. types.ts imports DataSource
// from here, and a cycle would break the enum exhaustiveness test.

export const dataSourceValues = [
  "provider_portal",
  "hud_hic_2025",
  "city_program",
  "county_osh",
] as const
export type DataSource = (typeof dataSourceValues)[number]

export const dataSourceLabel: Record<DataSource, string> = {
  provider_portal: "Set by site staff",
  hud_hic_2025: "HUD 2025 Housing Inventory Count",
  city_program: "City safe parking program page",
  county_osh: "Santa Clara County Office of Supportive Housing",
}

/** Stands in for the city column when the source does not name one.
 *
 * listings.city is NOT NULL with a default of 'San Jose', so a row with an
 * unknown city would silently claim to be in San Jose. This value says what we
 * actually know: the site is somewhere in the CA-500 county. It is deliberately
 * absent from cityCenters in lib/listings/geo.ts, so these rows report
 * "Distance not known" rather than a distance measured from a guess. */
export const unknownCity = "Santa Clara County"

/** Santa Clara County's own centralized shelter referral line. This is the
 * product's zero fits destination and the fallback for any row whose source
 * gives no phone number. */
export const here4You = {
  name: "Here4You",
  phone: "+14083852400",
  display: "(408) 385-2400",
  operator: "Santa Clara County Office of Supportive Housing",
} as const

// The HUD Continuum of Care code for Santa Clara County is CA-500. Note for
// anyone who arrives here from a ticket saying "CA-16": CA-16 is a California
// congressional district, not a HUD identifier. Searching HUD for CA-16 finds
// nothing.
export const hudHic2025 = {
  cocNumber: "CA-500",
  cocName: "San Jose/Santa Clara City & County CoC",
  title: "HUD 2025 Continuum of Care Housing Inventory Count Report",
  url: "https://files.hudexchange.info/reports/published/CoC_HIC_CoC_CA-500-2025_CA_2025.pdf",
  // HUD instructs CoCs to count a point in time during the last 10 days of
  // January. The report does not state which night CA-500 used, so we record
  // the start of that window. Erring older is the safe direction: it can only
  // make the data look less fresh than it is, never more.
  asOf: "2025-01-22",
  // Checked on this date. The 2026 edition is not published yet, so the 2025
  // report is current. Re-check each spring and bump both dates together.
  checkedOn: "2026-09-26",
} as const

/** Policy fields a data source may or may not publish. These are the fields
 * the seeker questionnaire asks about, so a gap here is a gap in matching. */
export const policyFieldValues = [
  "pets",
  "petWeightLimitLbs",
  "couples",
  "idRequired",
  "curfew",
  "intakeWindow",
  "maxStay",
  "vehicleAllowed",
  "registrationRequired",
  "address",
  "phone",
] as const
export type PolicyField = (typeof policyFieldValues)[number]

export const policyFieldLabel: Record<PolicyField, string> = {
  pets: "Pets",
  petWeightLimitLbs: "Pet weight limit",
  couples: "Couples",
  idRequired: "ID",
  curfew: "Curfew",
  intakeWindow: "Check-in hours",
  maxStay: "How long you can stay",
  vehicleAllowed: "Vehicles allowed",
  registrationRequired: "Registration",
  address: "Address",
  phone: "Phone",
}

// What each source actually publishes.
//
// hud_hic_2025 is the important one: HUD's inventory count is a bed census. It
// publishes provider, facility, project type and bed counts, and none of the
// operational rules a person needs in order to decide whether they can walk in
// tonight. It also contains zero safe parking sites, because parking is not
// bed inventory.
export const sourceCovers: Record<DataSource, readonly PolicyField[]> = {
  // Staff can answer anything about their own site.
  provider_portal: policyFieldValues,
  hud_hic_2025: [],
  city_program: ["address", "vehicleAllowed", "registrationRequired", "phone"],
  county_osh: ["address", "phone"],
}

export function sourcePublishes(
  source: DataSource | null,
  field: PolicyField
): boolean {
  if (!source) return true
  return sourceCovers[source].includes(field)
}

/** The sentence shown where a value would be. Says which of the two kinds of
 * empty this is, and always gives the person a way forward. */
export function coverageNote(
  source: DataSource | null,
  field: PolicyField
): string {
  if (!source) {
    return "Not published yet."
  }

  if (sourcePublishes(source, field)) {
    // The source does cover this field, it just has not been filled in here.
    return source === "provider_portal"
      ? "Not published yet. Call to check."
      : "Not listed in our source. Call to check."
  }

  if (source === "hud_hic_2025") {
    return `HUD's county bed count does not publish this. Call ${here4You.display} to check.`
  }

  if (source === "city_program") {
    return "The city's program page does not publish this. Call the lot to check."
  }

  return `The county listing does not publish this. Call ${here4You.display} to check.`
}

/** One line of attribution for the bottom of a site page. */
export function sourceCitation(
  source: DataSource | null,
  asOf: string | null
): string | null {
  if (!source) return null
  if (source === "hud_hic_2025") {
    return `${dataSourceLabel[source]}, CoC ${hudHic2025.cocNumber}, counted January 2025.`
  }
  const when = asOf ? ` Checked ${asOf}.` : ""
  return `${dataSourceLabel[source]}.${when}`
}
