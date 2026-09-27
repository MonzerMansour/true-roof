import { interestLabel, type InterestKind } from "@/lib/listings/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type InterestItem = {
  id: string
  user_id: string
  kind: InterestKind
  created_at: string
}

export function ListingInterestPanel({ rows }: { rows: InterestItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>People who asked</CardTitle>
        <CardDescription>
          Waitlist, bed requests, and on-the-way notes from seekers. This is
          interest, not an approved handoff.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has asked yet. When they join a waitlist or ask for a bed,
            they show up here.
          </p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((row) => (
              <li key={row.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{interestLabel[row.kind]}</p>
                <p className="text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()} ·{" "}
                  <span className="font-mono">{row.user_id.slice(0, 8)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
