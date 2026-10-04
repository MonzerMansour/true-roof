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
