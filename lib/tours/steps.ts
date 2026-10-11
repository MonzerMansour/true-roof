// The two guided tours, one per role.
//
// A step is a page, in the order someone would actually meet it, with what
// the page is for and the one thing to do there. The wording follows
// .cursor/rules/language-dignity.mdc: it says what to do rather than
// describing the system, and it never implies a judgement about the person.
//
// Kept as data rather than JSX so the steps can be counted, filtered by what
// the person can actually reach, and unit tested without rendering anything.

export type TourRole = "seeker" | "provider"

export type TourStep = {
  id: string
  /** The page this step is about. The tour navigates here when it differs
   * from where the person already is. Two steps may share a path when one
   * page has two things worth saying. */
  path: string
  title: string
  /** What the page is for. Two sentences at most. */
  body: string
  /** The single thing to do here, shown on its own line. */
  action?: string
  /** Shown only to someone with an account. A guest gets the signed-out step
   * instead, which names what an account adds. */
  accountOnly?: boolean
  /** Shown only to a director, who is the only one who can reach it. */
  directorOnly?: boolean
  /** Shown only while the person has no organization yet. */
  withoutOrgOnly?: boolean
  /** Shown only once the organization has at least one site. */
  withSiteOnly?: boolean
  /** Path needs a real listing id substituted in. */
  needsListingId?: boolean
}

const seekerSteps: TourStep[] = [
  {
    id: "places",
    path: "/places",
    title: "Every place we know about",
    body: "Shelters and safe parking in one list, closest and most recently confirmed first. Calling and directions never need an account.",
    action: "Tap Near me to sort by how far away each one is.",
  },
  {
    id: "filters",
    path: "/places",
    title: "Cut the list down",
    body: "Filters sit behind the Filters button: distance, shelter or parking, how you get in, and how fresh the information is. Clear all puts everything back.",
    action: "Open Filters and set the distance you can actually travel.",
  },
  {
    id: "place",
    path: "/places",
    title: "One place, in full",
    body: "Opening a place gives you its rules, what it costs, what to bring, the phone number and directions. Where a rule is blank, nobody has published it, which is not the same as no.",
    action: "Tap any place in the list to open its own page.",
  },
  {
    id: "match",
    path: "/get-started/find-a-place",
    title: "Get the list matched to you",
    body: "Ten short questions about pets, ID, a partner, a car, and what time you can get there. Places that cannot take you drop off, and the rest get a match score.",
    action: "Answer what applies and skip what does not.",
    accountOnly: true,
  },
  {
    id: "signed-out",
    path: "/places",
    title: "What an account adds",
    body: "Signing in lets you answer ten questions once and have every place scored against them, with the ones that cannot take you removed. Your answers follow you to a borrowed phone. Everything else works without one.",
    action: "Sign in from the card on this page, or carry on browsing.",
  },
  {
    id: "home",
    path: "/home",
    title: "Where you pick up again",
    body: "Your dashboard holds the places you saved, the ones you opened, and anything with a date on it. It is the page to come back to.",
    action: "Have a look at what is waiting there.",
  },
  {
    id: "plan",
    path: "/get-started/financial-help",
    title: "If you already have a place",
    body: "Tell True Roof your rent, which programs you are on, and your bills, and it writes out the year of dates for you. This is saved on this phone and sent nowhere.",
    action: "Fill this in once you have keys, not before.",
  },
  {
    id: "financials",
    path: "/financials",
    title: "Rent, bills, and the dates that are easy to miss",
    body: "What is due, what is coming, and what you have already done. You can photograph a county letter and it becomes one plain task.",
    action: "Tick things off here as you go.",
  },
  {
    id: "settings",
    path: "/settings",
    title: "Make it readable, or delete all of it",
    body: "Bigger text, higher contrast, and light or dark. Your answers and your plan can each be deleted from this phone in one tap, with nothing left behind.",
    action: "Set the text size you can read comfortably.",
  },
]

const providerSteps: TourStep[] = [
  {
    id: "create",
    path: "/portal/create",
    title: "Start with your organization",
    body: "One organization, then one row for each physical site you run. Staff share the organization, so nobody enters it twice.",
    action: "Create the organization, or ask a colleague for the join code.",
    withoutOrgOnly: true,
  },
  {
    id: "portal",
    path: "/portal",
    title: "Your sites",
    body: "Every site your organization has, draft or published. A draft stays off the seeker list until you publish it, so a site can be filled in over several sittings.",
    action: "Open a site to see what seekers are shown.",
  },
  {
    id: "new-site",
    path: "/portal/sites/new",
    title: "Adding a site",
    body: "One row per physical address, never one per program. A name, a city and a type are all that is needed to start.",
    action: "Add a site here when you run more than one address.",
  },
  {
    id: "site-settings",
    path: "/portal/sites",
    title: "What seekers actually read",
    body: "The rules here decide who is shown your site: pets, couples, ID, curfew, intake hours and vehicles. Leave a rule blank where your site has not published one, because blank is shown as not published rather than as no.",
    action: "Fill in the rules you are certain of and leave the rest blank.",
    needsListingId: true,
    withSiteOnly: true,
  },
  {
    id: "description",
    path: "/portal/sites",
    title: "The part the set options cannot carry",
    body: "About this site is free text, and it is what gets compared against how somebody described their own situation. What it is like to stay, what is nearby, what happens at intake.",
    action: "Write a few plain sentences, not a category label.",
    needsListingId: true,
    withSiteOnly: true,
  },
  {
    id: "access",
    path: "/portal/access",
    title: "Who on your staff can edit",
    body: "You approve the people who ask to join, and you decide who can change a listing. Somebody still pending cannot see or edit anything.",
    action: "Approve the colleagues you recognize and leave the rest pending.",
    directorOnly: true,
  },
  {
    id: "settings",
    path: "/portal/settings",
    title: "Your own account",
    body: "Text size, contrast, light or dark, and where you work. These apply to this phone only and change nothing a seeker sees.",
    action: "Set the text size you can read comfortably.",
  },
]

export const tours: Record<TourRole, { label: string; steps: TourStep[] }> = {
  seeker: { label: "Looking for a place", steps: seekerSteps },
  provider: { label: "Running a site", steps: providerSteps },
}

export type TourAudience = {
  signedIn: boolean
  isDirector?: boolean
  hasOrganization?: boolean
  primaryListingId?: string | null
}

/**
 * The steps this particular person can actually walk, with any dynamic path
 * filled in.
 *
 * A tour that offers a page the person cannot open is worse than no tour, so
 * the filtering happens here rather than inside the card. "Step 3 of 7" then
 * counts only the steps they will really see.
 */
export function stepsForTour(
  role: TourRole,
  audience: TourAudience
): TourStep[] {
  return tours[role].steps
    .filter((step) => {
      if (step.accountOnly && !audience.signedIn) return false
      // The signed-out step stands in for every account-only step, so someone
      // signed in must never see it.
      if (step.id === "signed-out" && audience.signedIn) return false
      if (step.directorOnly && !audience.isDirector) return false
      if (step.withoutOrgOnly && audience.hasOrganization !== false) return false
      if (step.withSiteOnly && !audience.primaryListingId) return false
      if (step.needsListingId && !audience.primaryListingId) return false
      return true
    })
    .map((step) =>
      step.needsListingId && audience.primaryListingId
        ? { ...step, path: `/portal/sites/${audience.primaryListingId}/settings` }
        : step
    )
}
