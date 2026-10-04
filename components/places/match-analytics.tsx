"use client"

import * as React from "react"
import { IconChartDots } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { PhrasePair } from "@/lib/matching/phrase-similarity"
import { formatPercent, lenientTextScore } from "@/lib/matching/score-blend"

// Developer mode only (Settings). Raw numbers behind a card's match badge,
// plus phrase-by-phrase cosine scores fetched on demand.
export function MatchAnalytics({
  listingId,
  cosine,
  categorical,
  score,
}: {
  listingId: string
  cosine: number
  categorical: number
  score: number
}) {
  const [pairs, setPairs] = React.useState<PhrasePair[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function load(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/match/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      })
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Sign in to see phrase scores."
            : "Could not load phrase scores."
        )
        return
      }
      setPairs(((await response.json()) as { pairs: PhrasePair[] }).pairs)
    } catch {
      setError("No connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 rounded-md bg-muted/50 p-2 text-xs">
      <p className="flex items-center gap-1 font-medium">
        <IconChartDots className="size-3.5" />
        Developer analytics
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono">
        <dt className="text-muted-foreground">cosine (whole text)</dt>
        <dd>{cosine.toFixed(3)}</dd>
        <dt className="text-muted-foreground">text, lenient</dt>
        <dd>{formatPercent(lenientTextScore(cosine))}</dd>
        <dt className="text-muted-foreground">fields</dt>
        <dd>{formatPercent(categorical)}</dd>
        <dt className="text-muted-foreground">blended</dt>
        <dd>{formatPercent(score)}</dd>
      </dl>

      {pairs ? (
        <ol className="space-y-1.5">
          {pairs.map((pair) => (
            <li key={pair.yours} className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block">&ldquo;{pair.yours}&rdquo;</span>
                <span className="block text-muted-foreground">
                  closest: &ldquo;{pair.theirs}&rdquo;
                </span>
              </span>
              <Badge variant="outline" className="shrink-0 font-mono">
                {pair.cosine.toFixed(3)}
              </Badge>
            </li>
          ))}
        </ol>
      ) : loading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : (
        <Button type="button" size="xs" variant="outline" onClick={load}>
          Score each phrase
        </Button>
      )}
      {error ? <p className="text-destructive">{error}</p> : null}
    </div>
  )
}
