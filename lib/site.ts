export const site = {
  name: "True Roof",
  tagline: "Get a home. Stay housed.",
  description:
    "Find a shelter or safe parking place that actually fits. Then keep the deadlines that keep the housing.",
} as const

export type Audience = "seeker" | "provider"

export function audienceFromPath(pathname: string): Audience {
  return pathname === "/for-providers" || pathname.startsWith("/for-providers/")
    ? "provider"
    : "seeker"
}

export type NavItem = {
  href: string
  label: string
  description?: string
}

export const primaryNav: NavItem[] = [
  {
    href: "/",
    label: "For you",
    description: "Need a place tonight, or just got housed.",
  },
  {
    href: "/for-providers",
    label: "For shelters & lots",
    description: "Update your site. See who is looking.",
  },
]

export const featureNav: NavItem[] = [
  {
    href: "/features/matcher",
    label: "Find a place",
    description: "Hard filters, real constraints, one row per site.",
  },
  {
    href: "/features/parking",
    label: "Safe parking",
    description: "Cars and RVs sit next to shelters, not after them.",
  },
  {
    href: "/features/deadlines",
    label: "Deadlines",
    description: "Rent, CalFresh, Medi-Cal — on a list and on your calendar.",
  },
  {
    href: "/features/letters",
    label: "Photo a letter",
    description: "A county letter becomes one plain-language task.",
  },
  {
    href: "/features/savings",
    label: "Rent cushion",
    description: "Save toward a month of rent. The cushion is for real life.",
  },
  {
    href: "/features/help",
    label: "Get help",
    description: "Warnings you can act on. One tap to a person.",
  },
  {
    href: "/features/income",
    label: "Will this job hurt me?",
    description: "See rent, CalFresh, and Medi-Cal before you say yes.",
  },
  {
    href: "/features/privacy",
    label: "Cheap phone & privacy",
    description: "Works offline. Photos are read, then deleted.",
  },
  {
    href: "/features/quiet",
    label: "Quiet mode",
    description: "Six steady months, and the app gets out of the way.",
  },
]
