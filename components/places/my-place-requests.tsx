"use client"

import * as React from "react"
import Link from "next/link"

import { loadMyInterests } from "@/lib/listings/interest-actions"
import type { InterestRow } from "@/lib/listings/interest"
import { interestLabel } from "@/lib/listings/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MyPlaceRequests() {
  const [rows, setRows] = React.useState<InterestRow[] | null>(null)

  React.useEffect(() => {
    void loadMyInterests().then(setRows)
  }, [])

  if (!rows || rows.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your asks</CardTitle>
        <CardDescription>
          Waitlists and bed requests you sent. Staff can see these. This is not
          an approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div>
              <p className="font-medium">{row.listingName}</p>
              <p className="text-muted-foreground">{interestLabel[row.kind]}</p>
            </div>
            <Link href={`/places/${row.listingId}`} className="underline">
              Open
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
