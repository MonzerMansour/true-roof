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
// Checked 2026-09-26. Re-verified 2026-10-06 against the Mountain View city
// page (lot table unchanged: same four lots, same hours, same 105 spaces) and
// expanded with operator-published operational detail from MOVE Mountain View
// and Amigos de Guadalupe.
//
// Re-check each page and bump checkedOn when you do.
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

  // Operational detail the operators publish. There are no database columns
  // for these yet, so they are recorded here as structured data and folded
  // into vehicleNote / the org description for display. Promoting them to real
  // columns is a schema change and deliberately out of scope here.

  /** Free, or what it costs. Operators state this plainly; people ask first. */
  cost: string | null
  /** How an applicant is assessed, and who gets priority. */
  screening: string | null
  /** Documents needed to qualify. The single biggest barrier to entry. */
  documents: readonly string[] | null
  /** Toilets, showers, wash stations. */
  facilities: string | null
  /** On-site or patrolling security, if the operator publishes it. */
  security: string | null
  /** How long someone may stay. Null when the operator sets no fixed cap. */
  maxStayNote: string | null
  /** Whether there is a waitlist, and what the operator says about its length. */
  waitlist: string | null
  /** Pets, where the operator publishes a policy. */
  petsNote: string | null
  /** True when the lot's own street address is NOT published by the operator,
   * so the application path is the office or phone rather than driving up. */
  addressWithheld?: boolean
}

const mountainView = "69e0273f-a643-5794-8b66-770cc90302e7"
const sanJose = "0cf22988-d7d5-56f2-a5ad-7429f1ea9452"
const county = "bf346f87-e559-5094-a240-aa05d5eb9a1a"
const amigos = "9c1b8f5a-ffc1-5e64-b75a-3c03b75fc9e3"

const mvSource =
  "https://www.mountainview.gov/our-city/departments/city-manager-s-office/human-services/homelessness/safe-parking"
const sjSource =
  "https://www.sanjoseca.gov/your-government/departments-offices/housing/homelessness-response/supportive-parking"
const amigosSource = "https://www.amigoscenter.com/safepark"
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
      "Runs the City of Mountain View safe parking lots, seven days a week, and is one of the county's two contracted safe parking operators. Free: it is temporary shelter, not a rental. To apply, call (650) 861-0181 or email movemvemail@gmail.com; the application goes straight onto a waitlist whose length depends on vacancies. You need a current California driver's license, vehicle registration, and insurance, and if you cannot get those, call the office and they will refer you for help. Every lot has restrooms and hand washing stations, with 24/7 security driving through and staff checking daily. Stays renew month to month with a case manager while you work toward permanent housing. Priority goes to Mountain View and Palo Alto residents, and to Santa Clara County applicants who are disabled or seniors. MOVE manages seven lots in total; the four below are the city-run ones, and rules on hours and pets differ lot by lot.",
  },
  {
    id: sanJose,
    name: "City of San Jose Housing Department",
    description:
      "Runs two safe parking sites through contracted providers. Intake is through the city's targeted outreach program, not walk up, so call or email safe.parking@sanjoseca.gov rather than driving to the lot. The program is focused on RVs. One operable commuter car is allowed per participant when there is space. Participants get case management and two meals a day.",
  },
  {
    id: amigos,
    name: "Amigos de Guadalupe",
    description:
      "One of the county's two contracted safe parking operators, serving people living in operable cars, trucks, vans, and SUVs with overnight parking, case management, and free showers through local YMCAs. Up to two pets are welcome with proof of current vaccinations. Apply by taking copies of your documents to 1897 Alum Rock Avenue, Suite 35, San Jose, or emailing them to safepark@amigosdeguadalupe.org. You need a current driver's license for drivers, current ID for every adult, a birth certificate for every child, current vehicle registration, insurance even if expired, and the last 30 days of income and expenses.",
  },
  {
    id: county,
    name: "County of Santa Clara Office of Supportive Housing",
    description:
      "Funds safe parking across the county and runs the Here4You referral line at (408) 385-2400 for shelter and temporary housing.",
  },
]

// MOVE Mountain View publishes these on its own FAQ and they apply to every
// lot it runs, so they are declared once rather than repeated four times.
// https://www.movemv.org/safe-parking
const moveOperations = {
  cost: "Free. It is temporary shelter, not a rental.",
  screening:
    "An intake with both a parking lot manager and a case manager. Priority goes to Mountain View and Palo Alto residents, and to Santa Clara County applicants who are disabled or seniors.",
  documents: [
    "Current California driver's license",
    "Current vehicle registration",
    "Vehicle insurance",
  ],
  facilities: "Restrooms and hand washing stations on every lot.",
  security:
    "Security drives through every lot 24/7, and staff check the lots daily.",
  maxStayNote:
    "No fixed limit. Stays renew month to month with a case manager while you work toward permanent housing.",
  waitlist:
    "Applying puts you straight onto the waitlist. Length depends on vacancies, so call to check where you are.",
  // The operator says hours and pet rules differ lot by lot, so this is not
  // claimed per lot.
  petsNote: null,
} as const

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
    // Corrected 2026-10-06. MOVE requires a current licence, registration and
    // insurance, so this was wrong as null. They refer people for help getting
    // the documents, which is why it is "required" rather than a hard no.
    registrationRequired: "required",
    // "24 Hour Use", so there is no entry window to compare against.
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Oversized vehicles with some passenger vehicles. 46 oversized vehicle spaces, 2 ADA spaces, 1 loading zone.",
    ...moveOperations,
    sourceUrl: mvSource,
    checkedOn: "2026-10-06",
  },
  {
    id: "d85acebc-cf5e-5be0-892a-5ab25b53fec8",
    orgId: mountainView,
    name: "Evelyn Lot",
    city: "Mountain View",
    address: "Evelyn Avenue, Mountain View, CA",
    phone: "+16508610181",
    vehicleAllowed: "car_van_rv",
    // Corrected 2026-10-06. MOVE requires a current licence, registration and
    // insurance, so this was wrong as null. They refer people for help getting
    // the documents, which is why it is "required" rather than a hard no.
    registrationRequired: "required",
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Call to verify this lot is still open. Former VTA parking lot, oversized vehicles with some passenger vehicles, 30 oversized vehicle spaces plus 21 flex spaces. The city page still lists it, but the extension it cites ran to June 30 2026, which has passed, and the page has not been updated since. Do not drive here without ringing MOVE Mountain View first.",
    ...moveOperations,
    sourceUrl: mvSource,
    checkedOn: "2026-10-06",
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
    registrationRequired: "required",
    // "Overnight use from 7pm to 7am". Wraps past midnight.
    intakeFrom: "19:00",
    intakeTo: "07:00",
    vehicleNote: "Passenger vehicles only. 4 spaces. Faith hosted lot.",
    ...moveOperations,
    sourceUrl: mvSource,
    checkedOn: "2026-10-06",
  },
  {
    id: "5ba5ac6a-9b37-5caa-8353-30f7c43a400c",
    orgId: mountainView,
    name: "Lord's Grace Lot",
    city: "Mountain View",
    address: null,
    phone: "+16508610181",
    vehicleAllowed: "car_only",
    registrationRequired: "required",
    // "Overnight use from 6pm to 8am". Wraps past midnight.
    intakeFrom: "18:00",
    intakeTo: "08:00",
    vehicleNote: "Passenger vehicles only. 4 spaces. Faith hosted lot.",
    ...moveOperations,
    sourceUrl: mvSource,
    checkedOn: "2026-10-06",
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
    cost: null,
    screening: null,
    documents: null,
    facilities: null,
    security: null,
    maxStayNote: null,
    waitlist: null,
    petsNote: null,
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
    cost: null,
    screening: null,
    documents: null,
    facilities: null,
    security: null,
    maxStayNote: null,
    waitlist: null,
    petsNote: null,
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
    // Corrected 2026-10-06. MOVE requires a current licence, registration and
    // insurance, so this was wrong as null. They refer people for help getting
    // the documents, which is why it is "required" rather than a hard no.
    registrationRequired: "required",
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Recreational vehicles and passenger cars. City owned lot near the Baylands Athletic Center, with water, power, lighting, and restrooms. Funded by the County of Santa Clara.",
    cost: null,
    screening: null,
    documents: null,
    facilities: null,
    security: null,
    maxStayNote: null,
    waitlist: null,
    petsNote: null,
    sourceUrl: paSource,
    checkedOn: "2026-09-26",
  },
  // Amigos de Guadalupe. The county's other contracted safe parking operator.
  //
  // No street address. Their own page publishes an application path (documents
  // to the office or by email) and never a lot location. Reporting places a lot
  // at the Santa Teresa VTA station, but in January 2026 the City of San Jose
  // said that site was unpermitted and in breach of several codes. Publishing a
  // lot address that the city is contesting could send someone to a space they
  // are towed or moved on from, so the application path is what is listed here.
  // Confirm the lot's status with the operator before adding an address.
  {
    id: "de24d402-63b0-5d38-83a4-8d7fa298928d",
    orgId: amigos,
    name: "Amigos de Guadalupe Safe Park",
    city: "San Jose",
    address: null,
    addressWithheld: true,
    phone: null,
    // Their page says operable cars, trucks, vans and SUVs. It does not say
    // RVs, so this is not car_van_rv.
    vehicleAllowed: "car_van",
    registrationRequired: "required",
    intakeFrom: null,
    intakeTo: null,
    vehicleNote:
      "Operable cars, trucks, vans, and SUVs. Overnight parking for individuals and families, with case management and free showers through local YMCAs.",
    cost: null,
    screening:
      "Apply by taking copies of your documents to 1897 Alum Rock Avenue, Suite 35, San Jose, or emailing them to safepark@amigosdeguadalupe.org. Copies must be clear and legible.",
    documents: [
      "Current driver's license, for drivers",
      "Current ID for every adult staying in the vehicle",
      "Birth certificate for every child staying in the vehicle",
      "Current vehicle registration",
      "Vehicle insurance, even if expired",
      "Proof of income and expenses for the last 30 days",
    ],
    facilities: "Free showers through partnerships with local YMCAs.",
    security: null,
    maxStayNote: null,
    waitlist: null,
    petsNote: "Up to two pets, with proof of current vaccinations.",
    sourceUrl: amigosSource,
    checkedOn: "2026-10-06",
  },
]
