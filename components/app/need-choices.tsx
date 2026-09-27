import Link from "next/link"

import { MarketingPhoto } from "@/components/marketing/marketing-photo"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { photos } from "@/lib/photos"

export function NeedChoices() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <ChoiceCard
        href="/get-started/find-a-place"
        title="Looking for shelter tonight"
        body="A bed or a safe place to park. A few questions, then your places."
        photo={photos.parking}
      />
      <ChoiceCard
        href="/get-started/financial-help"
        title="Looking for financial help"
        body="You already have a place. Rent, bills, and program deadlines in Financials."
        photo={photos.documents}
      />
    </div>
  )
}

function ChoiceCard({
  href,
  title,
  body,
  photo,
}: {
  href: string
  title: string
  body: string
  photo: (typeof photos)[keyof typeof photos]
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full gap-0 py-0 transition-colors hover:bg-muted/40">
        <MarketingPhoto
          photo={photo}
          className="aspect-[16/9] w-full"
          sizes="(min-width: 640px) 50vw, 100vw"
        />
        <CardHeader className="py-5">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{body}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
