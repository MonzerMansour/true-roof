import Link from "next/link"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const stubs = [
  {
    href: "/financials/letters",
    title: "Photo a letter",
    body: "Take a picture of a county or landlord letter. We turn it into one plain-language task, then discard the photo. Not built yet.",
  },
  {
    href: "/financials/income",
    title: "Will this job hurt me?",
    body: "Estimate how a new wage changes rent share, CalFresh, and Medi-Cal before you say yes. Estimates only. Not built yet.",
  },
  {
    href: "/financials/quiet",
    title: "Quiet mode",
    body: "After about six steady months, reminders step back to renewals only. Any warning sign turns full monitoring back on. Not built yet.",
  },
  {
    href: "/financials/get-help",
    title: "Get Help",
    body: "When rent or a recert is at risk, one tap reaches a person or a hotline path. Crisis and DV still skip the data bundle. Not built yet.",
  },
]

export function FinancialStubs() {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="font-heading text-xl font-semibold">Coming next</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These sit under Financials. They are not live yet. Each page says what
          belongs there.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {stubs.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm">{item.body}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
