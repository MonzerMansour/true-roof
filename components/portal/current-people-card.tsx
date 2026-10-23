"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateCurrentPeople } from "@/lib/portal/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ALMOST_FULL_AT,
  fillLevel,
  fillLevelLabel,
  spotsLeftText,
} from "@/lib/listings/availability"

/**
 * How many people are there right now, changed without opening the settings
 * form. It is the one number staff update through the day, so it gets its own
 * small card instead of living only inside a long form.
 *
 * It shows what a seeker will read, "Almost full" included, so staff see the
 * effect of the number they just typed.
 */
export function CurrentPeopleCard({
  listingId,
  totalBeds,
  currentPeople,
}: {
  listingId: string
  totalBeds: number | null
  currentPeople: number | null
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const level = fillLevel({ totalBeds, currentPeople })
  const left = spotsLeftText({ totalBeds, currentPeople })

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const result = await updateCurrentPeople(
        listingId,
        new FormData(event.currentTarget)
      )

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Updated.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>People there now</CardTitle>
          {level ? (
            <Badge variant={level === "full" ? "secondary" : "warning"}>
              {fillLevelLabel[level]}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          {totalBeds === null
            ? "Say the most people this site can hold under Edit details, then you can keep this count current here."
            : `${currentPeople ?? "Not set"} of ${totalBeds}${left ? `, ${left}` : ""}. At ${ALMOST_FULL_AT} spots left or fewer, people see "Almost full".`}
        </CardDescription>
      </CardHeader>
      {totalBeds === null ? null : (
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
            <Field className="w-40">
              <FieldLabel htmlFor="currentPeople">Count now</FieldLabel>
              <Input
                id="currentPeople"
                name="currentPeople"
                type="number"
                inputMode="numeric"
                min={0}
                max={totalBeds}
                required
                defaultValue={currentPeople ?? ""}
              />
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Updating…" : "Update"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
