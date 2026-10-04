"use client"

import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  formatTime,
  householdLabel,
  idLabel,
  latestEntryLabel,
  partnerRoomsLabel,
  petLabel,
  stayLabel,
  vehicleLabel,
  vehicleRegisteredLabel,
  vehicleSizeLabel,
  type SeekerNeeds,
} from "@/lib/matching/needs"

export type NeedsStepId =
  | "household"
  | "partnerRooms"
  | "pet"
  | "petWeight"
  | "id"
  | "vehicle"
  | "vehicleDetails"
  | "arrival"
  | "curfew"
  | "stay"
  | "placeNote"

export function NeedsSummary({
  needs,
  synced,
  onClear,
}: {
  needs: SeekerNeeds
  synced?: boolean
  onClear?: () => void
}) {
  const rows: [string, string, NeedsStepId][] = [
    ["Who", householdLabel[needs.household], "household"],
  ]

  if (needs.partnerRooms) {
    rows.push(["Rooms", partnerRoomsLabel[needs.partnerRooms], "partnerRooms"])
  }

  rows.push(["Pet", petLabel[needs.pet], "pet"])

  if (needs.pet === "small_pet") {
    rows.push([
      "Pet weight",
      needs.petWeightLbs ? `About ${needs.petWeightLbs} pounds` : "Not given",
      "petWeight",
    ])
  }

  rows.push(["Photo ID", idLabel[needs.idStatus], "id"])
  rows.push(["Vehicle", vehicleLabel[needs.vehicle], "vehicle"])

  if (needs.vehicleSize) {
    rows.push(["Vehicle size", vehicleSizeLabel[needs.vehicleSize], "vehicleDetails"])
  }
  if (needs.vehicleRegistered) {
    rows.push([
      "Registered",
      vehicleRegisteredLabel[needs.vehicleRegistered],
      "vehicleDetails",
    ])
  }

  rows.push([
    "Can check in",
    `${formatTime(needs.arrivalFrom)} to ${formatTime(needs.arrivalTo)}`,
    "arrival",
  ])
  rows.push(["Late entry", latestEntryLabel(needs.latestEntry), "curfew"])
  rows.push(["Bed needed", stayLabel(needs.daysNeeded), "stay"])
  rows.push(["In your words", needs.placeNote ?? "Nothing added", "placeNote"])

  return (
    <div>
      <p className="text-muted-foreground">
        {synced
          ? "Saved on this phone and to your account. Nothing is sent to a shelter."
          : "Saved on this phone. Nothing is sent to a shelter."}
      </p>

      <dl className="mt-6 divide-y rounded-lg border">
        {rows.map(([label, value, stepId]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="flex flex-col gap-0.5">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
            <Link
              href={`/get-started/find-a-place?edit=${stepId}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Change
              <span className="sr-only"> {label}</span>
            </Link>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/get-started/find-a-place?edit=all"
          className={buttonVariants({ variant: "outline" })}
        >
          Answer everything again
        </Link>
        {onClear ? (
          <Button variant="outline" onClick={onClear}>
            Delete my answers
          </Button>
        ) : null}
      </div>
    </div>
  )
}
