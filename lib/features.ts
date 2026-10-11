import { photos, type Photo } from "@/lib/photos"

export type FeatureSection = {
  title: string
  body: string
  bullets?: string[]
}

export type Feature = {
  slug: string
  eyebrow: string
  title: string
  lede: string
  photo: Photo
  audience: "seeker" | "both"
  sections: FeatureSection[]
}

export const features: Feature[] = [
  {
    slug: "matcher",
    eyebrow: "Short term",
    title: "Find a place that actually fits",
    lede: "Tell True Roof the real constraints: pets, ID, a partner, a curfew, a car. Hard rules remove a listing. What is left is sorted by distance and how fresh the information is.",
    photo: photos.building,
    audience: "seeker",
    sections: [
      {
        title: "One row per physical site",
        body: "A multi-site organization is not one listing. Each address has its own row, tied to a shared org record. Verified attributes sit on the listing, not behind a tap.",
      },
      {
        title: "Constraints are structured, never yes/no",
        body: "Listings cannot invent their own categories. New values get added to the shared list.",
        bullets: [
          "Pets: not allowed / service animals only / small pets under a weight limit / any pet",
          "ID: required / not required / case by case",
          "Couples: not allowed / same room / separate rooms",
          "Curfew, intake window, and max stay are real times, not a paragraph",
        ],
      },
      {
        title: "How matching works",
        body: "Hard constraints (no dogs, no cars, intake closed) take a listing off the main list. Removed sites stay one tap away, with the reason. If nothing fits, True Roof opens the Here4You referral path into coordinated entry. If no single site fits the whole household, you can see two listings instead of one bad compromise.",
      },
      {
        title: "Trust the listing as a whole",
        body: "You do not get a badge per field. You get one freshness read: Live, Recent, or Call first. Tap for the detail (“confirmed 40 minutes ago”). Confidence fades on a curve, using that site’s own update history. A conflicting report lowers confidence and pings the shelter. It does not silently overwrite the number.",
      },
      {
        title: "Reviews go both ways",
        body: "People who stayed can comment, with a report option. Providers can also be reviewed as customers, so a site cannot tank a listing with bad-faith ratings and walk away. User reputation is a backend weight only. It is never shown as a public score.",
      },
    ],
  },
  {
    slug: "parking",
    eyebrow: "Short term",
    title: "Safe parking is a first-class result",
    lede: "If you sleep in a car or RV, that is the intake, not a footnote. Shelters and lots show up together.",
    photo: photos.parking,
    audience: "seeker",
    sections: [
      {
        title: "What each lot lists",
        body: "Hours allowed, vehicle type and max size, registration versus walk-up, bathroom access, security on site, max consecutive nights, and waitlist status.",
      },
      {
        title: "Legal status, in three words",
        body: "City-sanctioned, org-run, or informally tolerated. Informal lots stay hidden until you opt in, with a disclaimer. Enforcement risk is a later layer, not in the first version.",
      },
      {
        title: "How you get in",
        body: "Every lot has a process type: application, waitlist/registration, or walk-up. Walk-up needs no special handling.",
      },
      {
        title: "Availability reads simpler on purpose",
        body: "The same freshness model runs underneath, but you only see open, full, or a count. No tier badge. No timestamp on the lot card. Beds and parking should not look the same.",
      },
    ],
  },
  {
    slug: "deadlines",
    eyebrow: "After you get housed",
    title: "The year, from a few facts",
    lede: "You tap “I got housed,” check the programs you have, and enter rent. True Roof writes the rest from rules it already knows.",
    photo: photos.calendar,
    audience: "seeker",
    sections: [
      {
        title: "Maria’s first month",
        body: "She moves in on September 15. She checks CalFresh, Medi-Cal, and a housing voucher. Rent is $1,450, due on the 1st. CalFresh started in April. From that, True Roof already has October rent, the CalFresh report on the 20th, November rent, Medi-Cal renewal next April, the voucher review next September, and every rent date through August.",
      },
      {
        title: "It lives where you already look",
        body: "Export an ICS file and the same deadlines show up in Google Calendar or Apple Calendar. Example: “Oct 1 Pay rent, $1,450, to Westgate Property Management.”",
      },
    ],
  },
  {
    slug: "letters",
    eyebrow: "After you get housed",
    title: "A photo of a letter becomes a task",
    lede: "County mail is small print and a form number you do not recognize. Photograph it. Three seconds later you get one card in plain language.",
    photo: photos.documents,
    audience: "seeker",
    sections: [
      {
        title: "Nothing new, said clearly",
        body: "“This is your CalFresh report form. It is due Oct 20. You need: last 2 pay stubs. We already had this on your list, so nothing changes.”",
      },
      {
        title: "When it is new, it goes to the top",
        body: "“Medi-Cal says your coverage will end Nov 30 because they could not verify your income. You have until Oct 25 to send proof or ask for a hearing. Here is the number to call.” That task sits above rent.",
      },
      {
        title: "The photo does not linger",
        body: "Letters are read, then the image is deleted by default. Nothing is auto-uploaded.",
      },
    ],
  },
  {
    slug: "savings",
    eyebrow: "After you get housed",
    title: "A cushion the size of rent",
    lede: "The goal is one month of rent. Life still happens. The bar can drop without turning red.",
    photo: photos.savings,
    audience: "seeker",
    sections: [
      {
        title: "Payday, then a little",
        body: "On October 10 she taps “I put away $20.” The bar moves: “$20 of $1,450. At this pace, about 18 months.” Some weeks $10. Some weeks nothing. By February she is at $310.",
      },
      {
        title: "This is what the cushion is for",
        body: "The car needs a $200 repair so she can keep getting to work. She taps “I used $200 for: other.” The bar drops to $110. True Roof says she is still on track for rent this month. No red. No warning. A reset.",
      },
    ],
  },
  {
    slug: "privacy",
    eyebrow: "The phone you actually have",
    title: "Built for a cheap phone, and for privacy",
    lede: "No app store required. It should run on low-end Android, on borrowed phones, and with no data.",
    photo: photos.nightCity,
    audience: "seeker",
    sections: [
      {
        title: "Installable, and SMS when data is gone",
        body: "A PWA you can add to the home screen. Reminders and key actions can go over SMS if that is the phone you have today.",
      },
      {
        title: "Offline tiers",
        body: "Deadline list, savings, and document capture work offline. Matcher results wait in a queue until there is signal.",
      },
      {
        title: "Your device first",
        body: "Data is stored locally and encrypted. You can see what is synced. PIN or biometric lock, with auto-lock. A quick-hide gesture drops to a neutral screen. Photos of letters are read, then deleted by default. SMS on the lock screen stays generic. Export is one tap. Delete is one tap. Nothing left behind.",
      },
      {
        title: "Access",
        body: "Large text, high contrast, screen reader, one-handed layout. Every control is reachable with a thumb and announced to a screen reader.",
      },
    ],
  },
]

export function getFeature(slug: string) {
  return features.find((feature) => feature.slug === slug)
}
