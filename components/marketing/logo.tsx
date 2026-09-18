import Image from "next/image"
import { cn } from "cn"

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string
  markClassName?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <Image
        src="/brand/true-roof-mark.png"
        alt=""
        width={566}
        height={146}
        className={cn("h-6 w-auto", markClassName)}
      />
      {showWordmark ? (
        <span className="font-heading text-[1.05rem] leading-none font-bold tracking-tight lowercase">
          true roof
        </span>
      ) : null}
    </span>
  )
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/true-roof.png"
      alt="True Roof"
      width={566}
      height={280}
      className={cn("h-auto w-40", className)}
    />
  )
}
