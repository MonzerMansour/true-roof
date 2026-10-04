import type { ReactNode } from "react"

import { Container } from "@/components/marketing/container"
import {
  MarketingPhoto,
  PhotoCredit,
} from "@/components/marketing/marketing-photo"
import { Badge } from "@/components/ui/badge"
import type { Photo } from "@/lib/photos"

/** Full-bleed photo hero shared by marketing pages. Matches the homepage
 * gradient language (primary wash over the photo, frosted header clearance). */
export function MarketingHero({
  photo,
  eyebrow,
  title,
  lede,
  actions,
  compact = false,
}: {
  photo: Photo
  eyebrow?: string
  title: string
  lede: string
  actions?: ReactNode
  compact?: boolean
}) {
  return (
    <section
      className={
        compact
          ? "relative isolate min-h-[20rem] overflow-hidden sm:min-h-[24rem]"
          : "relative isolate min-h-[24rem] overflow-hidden sm:min-h-[32rem]"
      }
    >
      <MarketingPhoto
        photo={photo}
        priority
        sizes="100vw"
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-primary/40 to-black/25" />
      <Container
        className={
          compact
            ? "relative flex min-h-[20rem] flex-col justify-end pt-28 pb-10 text-white sm:min-h-[24rem]"
            : "relative flex min-h-[24rem] flex-col justify-end pt-28 pb-12 text-white sm:min-h-[32rem]"
        }
      >
        {eyebrow ? (
          <Badge variant="secondary" className="w-fit bg-white/15 text-white">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-pretty text-white/85 sm:text-lg">
          {lede}
        </p>
        {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
        <PhotoCredit photo={photo} className="text-white/55" />
      </Container>
    </section>
  )
}
