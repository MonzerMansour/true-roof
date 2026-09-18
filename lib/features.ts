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
    lede: "Tell True Roof the real constraints — pets, ID, a partner, a curfew, a car. Hard rules remove a listing. What is left is sorted by distance and how fresh the information is.",
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
          "Curfew, intake window, and max stay are real times — not a paragraph",
        ],
      },
      {
        title: "How matching works",
        body: "Hard constraints (no dogs, no cars, intake closed) take a listing off the main list. Removed sites stay one tap away, with the reason. If nothing fits, True Roof opens the Here4You referral path into coordinated entry. If no single site fits the whole household, you can see two listings instead of one bad compromise.",
      },
      {
        title: "Trust the listing as a whole",
        body: "You do not get a badge per field. You get one freshness read: Live, Recent, or Call first. Tap for the detail (“confirmed 40 minutes ago”). Confidence fades on a curve, using that site’s own update history. A conflicting report lowers confidence and pings the shelter — it does not silently overwrite the number.",
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
    lede: "If you sleep in a car or RV, that is the intake — not a footnote. Shelters and lots show up together.",
    photo: photos.parking,
    audience: "seeker",
    sections: [
      {
        title: "What each lot lists",
        body: "Hours allowed, vehicle type and max size, registration versus walk-up, bathroom access, security on site, max consecutive nights, and waitlist status.",
      },
      {
        title: "Legal status, in three words",
        body: "City-sanctioned, org-run, or informally tolerated. Informal lots stay hidden until you opt in, with a disclaimer. Enforcement risk is a later layer — not in the first version.",
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
    slug: "help",
    eyebrow: "When it slips",
    title: "Warnings you can act on",
    lede: "Missed rent and a skipped check-in should not sit quietly in an app. True Roof names the level, names why, and names the next step.",
    photo: photos.phone,
    audience: "seeker",
    sections: [
      {
        title: "Watch",
        body: "March 6. Rent was due the 1st. CalFresh recert was due the 2nd. She skipped last week’s check-in. The top of the screen says Watch, lists why, and says: pay rent first if you can, then call the county. She can mark “I paid rent on the 4th, landlord did not give me a receipt.” Rent clears. One item remains.",
      },
      {
        title: "Act",
        body: "A 3-day pay-or-quit notice jumps the level to Act. The screen becomes a short list: emergency rent assistance, tenant legal aid, and “Share my situation with my case manager.”",
      },
      {
        title: "Get Help, one tap",
        body: "Manual anytime. Auto-surfaces at Act. You pick the door: prevention fund, 211, tenant legal aid, case manager, or a crisis line. You toggle each item in the bundle before it goes. The send is a secure expiring link plus a PDF, and a phone script if the door is phone-only. You see if the link was opened. True Roof never says it was approved.",
      },
      {
        title: "Crisis is separate",
        body: "911, DV, and 988 are a different button. That path skips the bundle. Links you already sent can be revoked. If you have no signal, the send waits, and the phone script is still on screen.",
      },
    ],
  },
  {
    slug: "income",
    eyebrow: "Work and benefits",
    title: "Will this job hurt me?",
    lede: "A raise can cost Medi-Cal. A gig week can look like too much income. True Roof shows rent share, CalFresh, and coverage before and after — then the honest monthly net.",
    photo: photos.work,
    audience: "seeker",
    sections: [
      {
        title: "What you enter",
        body: "Gross monthly, or a rate and hours. A range if the work is gig or uneven.",
      },
      {
        title: "What you see",
        body: "Before and after for rent share, CalFresh, and Medi-Cal. A net-change number. Cliffs (a hard drop-off) marked differently from gradual slopes. What you must report, to whom, and when it takes effect.",
      },
      {
        title: "Guardrails",
        body: "This is an estimate. Confirm with a worker. True Roof will not tell you to skip a job. The same tool runs in reverse after a job loss.",
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
        body: "Deadline list, savings, document capture, and the cliff calculator work offline. Matcher results and handoffs wait in a queue until there is signal.",
      },
      {
        title: "Your device first",
        body: "Data is stored locally and encrypted. You can see what is synced. PIN or biometric lock, with auto-lock. A quick-hide gesture drops to a neutral screen. Photos of letters are read, then deleted by default. SMS on the lock screen stays generic. Export is one tap. Delete is one tap. Nothing left behind.",
      },
      {
        title: "Access",
        body: "Large text, high contrast, screen reader, voice input, one-handed layout. Dictate is a first-class way in — not an afterthought.",
      },
    ],
  },
  {
    slug: "quiet",
    eyebrow: "When things are steady",
    title: "The app gets quiet",
    lede: "True Roof is not supposed to nag you forever. About six months of on-time rent, no missed deadlines, and no warnings, and it steps back.",
    photo: photos.window,
    audience: "seeker",
    sections: [
      {
        title: "Active, then Steady, then Graduated",
        body: "Quiet mode keeps essential renewal reminders only. It is not blind. Any warning sign turns full monitoring back on immediately, in an encouraging tone — not a punishment.",
      },
      {
        title: "What you can take with you",
        body: "A clean on-time rent-history letter for a future landlord. Mentor mode (later) is for helping a newer person, with moderation.",
      },
      {
        title: "No thrash",
        body: "Reactivation is instant. Graduating again takes another stretch of steadiness. The app does not bounce you in and out of quiet because of one noisy week.",
      },
    ],
  },
]

export function getFeature(slug: string) {
  return features.find((feature) => feature.slug === slug)
}
