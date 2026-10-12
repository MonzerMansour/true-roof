"use client"

import { usePathname } from "next/navigation"

import { GuidedTour } from "@/components/app/guided-tour"

/**
 * The tour of the feature pages, offered only while somebody is actually on
 * them.
 *
 * The marketing layout also covers the landing page and the provider page,
 * and a walkthrough of the feature pages popping up over the front door would
 * be an advert for a tour rather than a tour. So it is scoped by path here
 * instead of mounted everywhere the layout reaches.
 *
 * Its last step is /places, which is in a different layout, so the tour ends
 * as that page loads. That is the intended ending: the point of reading about
 * the features is to go and use them.
 */
export function FeaturesTour() {
  const pathname = usePathname()

  if (!pathname.startsWith("/features")) return null

  // Nothing on these pages is gated, so there is no audience to filter by.
  return <GuidedTour tour="features" audience={{ signedIn: false }} />
}
