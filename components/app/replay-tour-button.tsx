"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconRoute } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { stepsForTour, type TourAudience, type TourRole } from "@/lib/tours/steps"
import { replayTour } from "@/lib/tours/storage"

/**
 * Starts the tour for this role again, from step one.
 *
 * Lives in settings because that is where somebody goes looking for a thing
 * they turned off. It navigates to the first step itself rather than waiting
 * for the person to find that page, so the button does something visible
 * where it was pressed.
 */
export function ReplayTourButton({
  role,
  audience,
}: {
  role: TourRole
  audience: TourAudience
}) {
  const router = useRouter()
  const steps = stepsForTour(role, audience)
  const first = steps[0]

  if (!first) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      className="w-fit"
      onClick={() => {
        replayTour(role)
        router.push(first.path)
      }}
    >
      <IconRoute />
      Replay the tour
    </Button>
  )
}
