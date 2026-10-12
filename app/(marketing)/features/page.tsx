import type { Metadata } from "next"

import { FeaturesCardRail } from "@/components/marketing/features-card-rail"
import { FeaturesPathHero } from "@/components/marketing/features-path-hero"
import { ReplayTourButton } from "@/components/app/replay-tour-button"
import { SignInButton } from "@/components/marketing/sign-in-button"
import { features } from "@/lib/features"
import { photos } from "@/lib/photos"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Matching, safe parking, deadlines, letters, savings, and privacy.",
}

export default function FeaturesPage() {
  return (
    <>
      <FeaturesPathHero
        photo={photos.building}
        title="Short term is a bed. Long term is staying housed."
        lede="Every tab below is a real part of True Roof. Start with finding a place. Everything after that is for after you have keys."
        actions={
          <>
            <SignInButton>Get started</SignInButton>
            <ReplayTourButton
              tour="features"
              audience={{ signedIn: false }}
              label="Take the tour"
            />
          </>
        }
      />

      <FeaturesCardRail features={features} />
    </>
  )
}
