import Image from "next/image"
import { cn } from "cn"

import type { Photo } from "@/lib/photos"

export function MarketingPhoto({
  photo,
  className,
  imageClassName,
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  quality = 80,
}: {
  photo: Photo
  className?: string
  imageClassName?: string
  priority?: boolean
  sizes?: string
  quality?: number
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  )
}

export function PhotoCredit({
  photo,
  className,
}: {
  photo: Photo
  className?: string
}) {
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      Photo: {photo.credit}
    </p>
  )
}

/**
 * Says out loud that a picture is not the place it sits above.
 *
 * Sits on the image rather than under it, because the two are read together
 * and a caption below a card gets skimmed past. It is a plain label, not a
 * tooltip or an icon: somebody deciding where to sleep tonight should not
 * have to hover anything to find out the picture is a stand-in.
 *
 * aria-hidden, and deliberately. The same fact is already the first thing in
 * the image's alt text, so announcing it twice would just be noise for
 * somebody using a screen reader.
 */
export function StandInPhotoBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      Not this place
    </span>
  )
}

/** The longer version, for a page with room for a sentence.
 *
 * No credit line: the drawing is ours and there is no photographer to name.
 * Saying where a picture came from was the old behaviour and it was the
 * problem, because a credit reads as provenance for a real photo. */
export function StandInPhotoNote({
  credit,
  source,
  className,
}: {
  /** Author and licence. Attribution is a condition of most of these
   * licences, so it is rendered, not just stored. */
  credit?: string
  /** The image's page, which carries the full licence terms. */
  source?: string
  className?: string
}) {
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      This is a stand-in picture, not a photo of this site. Nobody who runs it
      has sent one in yet.
      {credit ? (
        <>
          {" "}
          Photo:{" "}
          {source ? (
            <a className="underline" href={source} rel="nofollow noopener">
              {credit}
            </a>
          ) : (
            credit
          )}
          .
        </>
      ) : null}
    </p>
  )
}
