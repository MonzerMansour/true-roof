"use client"

import { GuidedTour } from "@/components/app/guided-tour"
import { useSession } from "@/components/auth/session-provider"

/**
 * The seeker tour, which needs no account: somebody signed out walks every
 * step except the questionnaire, and gets one step in its place naming what
 * signing in adds. Signing in mid-tour adds that step, and the index is
 * clamped, so the person is not thrown past where they were.
 */
export function SeekerTour() {
  const { session } = useSession()

  // A provider can reach /places like anyone else. They have their own tour,
  // so they are not offered this one on top of it.
  if (session?.role === "provider") return null

  return <GuidedTour tour="seeker" audience={{ signedIn: Boolean(session) }} />
}
