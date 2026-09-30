// Safe parking sites in Santa Clara County, from the cities that run them.
//
// HUD's Housing Inventory Count contains ZERO safe parking sites, because
// parking is not bed inventory. Verified: no match for "park" anywhere in the
// CA-500 2025 report. So this list cannot come from HUD and is curated from
// each city's own program page instead.
//
// Every field below is quoted or directly restated from the source page listed
// on the row. Nothing is inferred. Where a page is silent, the field is null
// and the person is told to call.
//
// Checked 2026-09-26. Re-check each page and bump checkedOn when you do.
// County of Santa Clara pages (osh.santaclaracounty.gov) return HTTP 403 to
// automated fetching, so the county rows below were read by a human in a real
// browser. Do not build a scraper against a 403.

import type { RegistrationRequired, VehicleAllowed } from "@/lib/listings/types"

export type SafeParkingSite = {
  id: string
  orgId: string
  name: string
  city: string
  /** Only where the city publishes a street address or a named lane. */
  address: string | null
  phone: string | null
  vehicleAllowed: VehicleAllowed | null
  registrationRequired: RegistrationRequired | null
  /** HH:MM. The hours a person may enter. intakeTo earlier than intakeFrom
   * wraps past midnight, which is the normal case for an overnight lot. */
  intakeFrom: string | null
  intakeTo: string | null
  /** Display only. Never read by the matcher. */
  vehicleNote: string | null
  sourceUrl: string
  checkedOn: string
}

const mountainView = "69e0273f-a643-5794-8b66-770cc90302e7"
const sanJose = "0cf22988-d7d5-56f2-a5ad-7429f1ea9452"
const county = "bf346f87-e559-5094-a240-aa05d5eb9a1a"

const mvSource =
  "https://www.mountainview.gov/our-city/departments/city-manager-s-office/human-services/homelessness/safe-parking"
const sjSource =
  "https://www.sanjoseca.gov/your-government/departments-offices/housing/homelessness-response/supportive-parking"
const paSource =
  "https://www.paloalto.gov/Departments/Planning-Development-Services/Current-Planning/Projects/2000-Geng-Road"

export const safeParkingOrganizations: {
  id: string
  name: string
  description: string
}[] = [
  {
    id: mountainView,
    name: "MOVE Mountain View",
    // Straight from the city page. These are stated preferences, not hard
    // rules, so they live here as prose rather than as invented enum values.
    description:
      "Runs the City of Mountain View safe parking lots. To apply, call (650) 861-0181 or email movemvemail@gmail.com. The city gives preference to families with students in Mountain View school districts, people who live or work in Mountain View, seniors 55 and older, and people with disabilities. Restrooms, water, and wash stations are on the lots.",
  },
  {
    id: sanJose,
    name: "City of San Jose Housing Department",
    description:
      "Runs two safe parking sites through contracted providers. Intake is through the city's targeted outreach program, not walk up, so call or email safe.parking@sanjoseca.gov rather than driving to the lot. The program is focused on RVs. One operable commuter car is allowed per participant when there is space. Participants get case management and two meals a day.",
  },
  {
    id: county,
    name: "County of Santa Clara Office of Supportive Housing",
    description:
      "Funds safe parking across the county and runs the Here4You referral line at (408) 385-2400 for shelter and temporary housing.",
  },
]

export const safeParkingSites: SafeParkingSite[] = [
  // Mountain View. The city publishes a lot by lot table with vehicle type and
  // hours, which is why these four are the most completely filled in rows in
  // the whole database.
  {
    id: "6f2a2ec5-1c51-546e-86b9-1c55b7b53f71",
    orgId: mountainView,
    name: "Shoreline Lot B",
    city: "Mountain View",
    address: "Crittenden Lane, Mountain View, CA",
    phone: "+16508610181",
    // Page says "OVs with some passenger vehicles". OV is the city's term for
    // an oversized lived-in vehicle.
    vehicleAllowed: "car_van_rv",
    registrationRequired: null,
    // "24 Hour Use", so there is no entry window to compare against.
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Oversized vehicles with some passenger vehicles. 46 oversized vehicle spaces, 2 ADA spaces, 1 loading zone.",
    sourceUrl: mvSource,
    checkedOn: "2026-09-26",
  },
  {
    id: "d85acebc-cf5e-5be0-892a-5ab25b53fec8",
    orgId: mountainView,
    name: "Evelyn Lot",
    city: "Mountain View",
    address: "Evelyn Avenue, Mountain View, CA",
    phone: "+16508610181",
    vehicleAllowed: "car_van_rv",
    registrationRequired: null,
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Former VTA parking lot. Oversized vehicles with some passenger vehicles. 30 oversized vehicle spaces plus 21 flex spaces. The city has extended use of this lot through June 30, 2026.",
    sourceUrl: mvSource,
    checkedOn: "2026-09-26",
  },
  {
    id: "dfd212b9-47bb-5c2f-aaa1-9abe08bf0231",
    orgId: mountainView,
    name: "St. Timothy's Lot",
    city: "Mountain View",
    address: null,
    phone: "+16508610181",
    // Page says "Passenger Vehicles".
    vehicleAllowed: "car_only",
    registrationRequired: null,
    // "Overnight use from 7pm to 7am". Wraps past midnight.
    intakeFrom: "19:00",
    intakeTo: "07:00",
    vehicleNote: "Passenger vehicles only. 4 spaces. Faith hosted lot.",
    sourceUrl: mvSource,
    checkedOn: "2026-09-26",
  },
  {
    id: "5ba5ac6a-9b37-5caa-8353-30f7c43a400c",
    orgId: mountainView,
    name: "Lord's Grace Lot",
    city: "Mountain View",
    address: null,
    phone: "+16508610181",
    vehicleAllowed: "car_only",
    registrationRequired: null,
    // "Overnight use from 6pm to 8am". Wraps past midnight.
    intakeFrom: "18:00",
    intakeTo: "08:00",
    vehicleNote: "Passenger vehicles only. 4 spaces. Faith hosted lot.",
    sourceUrl: mvSource,
    checkedOn: "2026-09-26",
  },

  // San Jose. The city page states different registration rules for its two
  // sites, which is the clearest published difference in the whole dataset.
  {
    id: "8745253f-a2b4-57df-928e-4813ddba22af",
    orgId: sanJose,
    name: "Santa Teresa Safe Parking",
    city: "San Jose",
    address: "Santa Teresa light rail station, San Jose, CA",
    phone: "+14085353500",
    vehicleAllowed: "car_van_rv",
    // "RV registration, operability and insurance are not required at the
    // Berryessa site, but they are required at the Santa Teresa site."
    registrationRequired: "required",
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Focused on RVs. One operable commuter car allowed when there is space. RV registration, operability, and insurance are required at this site.",
    sourceUrl: sjSource,
    checkedOn: "2026-09-26",
  },
  {
    id: "58263bfa-cdda-5ab9-8f1f-b1f6f2ce7b95",
    orgId: sanJose,
    name: "Berryessa Road Safe Parking",
    city: "San Jose",
    address: "Berryessa Road, San Jose, CA",
    phone: "+14085353500",
    vehicleAllowed: "car_van_rv",
    registrationRequired: "not_required",
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Focused on RVs. One operable commuter car allowed when there is space. RV registration, operability, and insurance are not required at this site.",
    sourceUrl: sjSource,
    checkedOn: "2026-09-26",
  },

  // Palo Alto. Capacity figures differ between city documents (12 in the lease
  // report, 22 in a later permit), so no capacity is recorded here.
  {
    id: "29ed0c70-2ca2-5015-8a3b-dee00029493e",
    orgId: county,
    name: "2000 Geng Road Safe Parking",
    city: "Palo Alto",
    address: "2000 Geng Road, Palo Alto, CA",
    phone: null,
    vehicleAllowed: "car_van_rv",
    registrationRequired: null,
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Recreational vehicles and passenger cars. City owned lot near the Baylands Athletic Center, with water, power, lighting, and restrooms. Funded by the County of Santa Clara.",
    sourceUrl: paSource,
    checkedOn: "2026-09-26",
  },
]
