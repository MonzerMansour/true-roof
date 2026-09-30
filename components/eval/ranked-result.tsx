import { IconCheck, IconX } from "@tabler/icons-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatPercent, lenientTextScore } from "@/lib/matching/score-blend"
import type { ScoreFactor } from "@/lib/matching/categorical-score"

export function RankedResult({
  id,
  rank,
  name,
  description,
  score,
  categorical,
  cosine,
  factors,
  badge,
}: {
  id: string
  rank: number
  name: string
  description: string
  score: number
  categorical: number
  cosine: number
  factors: ScoreFactor[]
  badge?: string
}) {
  // cosine comes in raw (0.2-ish to 0.6-ish); stretched here only for
  // display, hybridScore() already does its own version of this
  // internally when computing `score`.
  const textPercent = lenientTextScore(cosine)

  return (
    <Card>
      <CardContent className="py-2">
        <Accordion>
          <AccordionItem value={id} className="border-none">
            <AccordionTrigger className="items-center py-2 hover:no-underline">
              <div className="flex flex-1 items-start gap-4">
                <span className="font-heading w-8 shrink-0 text-lg text-muted-foreground">
                  {rank}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{name}</span>
                    {badge ? <Badge variant="secondary">{badge}</Badge> : null}
                    <Badge>{formatPercent(score)} match</Badge>
                    <Badge variant="outline">{formatPercent(categorical)} fields</Badge>
                    <Badge variant="outline">{formatPercent(textPercent)} text</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-12">
              <p className="mb-2 text-sm font-medium">Why this scored the way it did</p>
              <ul className="space-y-1.5">
                {factors.map((factor) => (
                  <li
                    key={factor.label}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{factor.label}:</span>{" "}
                      {factor.detail}
                    </span>
                    <Badge
                      variant={factor.score >= 0.7 ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {factor.score >= 0.7 ? (
                        <IconCheck className="size-3" aria-label="Matches" />
                      ) : (
                        <IconX className="size-3" aria-label="Does not match" />
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Plus a {formatPercent(textPercent)} embedded-text match.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
