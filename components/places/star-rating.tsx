import { IconStar, IconStarFilled, IconStarHalfFilled } from "@tabler/icons-react"

import { cn } from "cn"

export function StarRating({
  value,
  count,
  size = "sm",
  className,
  labelPrefix = "True Roof",
}: {
  value: number
  count?: number | null
  size?: "sm" | "md"
  className?: string
  labelPrefix?: string
}) {
  const clamped = Math.max(0, Math.min(5, value))
  const iconClass = size === "md" ? "size-5" : "size-4"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        className
      )}
      aria-label={`${labelPrefix} ${clamped.toFixed(1)} out of 5${
        typeof count === "number" ? `, ${count} review${count === 1 ? "" : "s"}` : ""
      }`}
    >
      <span className="inline-flex text-primary" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => {
          if (clamped >= star) {
            return <IconStarFilled key={star} className={iconClass} />
          }
          if (clamped >= star - 0.5) {
            return <IconStarHalfFilled key={star} className={iconClass} />
          }
          return <IconStar key={star} className={cn(iconClass, "opacity-40")} />
        })}
      </span>
      <span className="font-medium tabular-nums">{clamped.toFixed(1)}</span>
      {typeof count === "number" && count > 0 ? (
        <span className="text-muted-foreground">({count})</span>
      ) : null}
    </span>
  )
}

export function StarPicker({
  name = "stars",
  defaultValue = 0,
}: {
  name?: string
  defaultValue?: number
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Stars</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <input
              type="radio"
              name={name}
              value={star}
              defaultChecked={defaultValue === star}
              required
              className="sr-only"
            />
            <IconStarFilled className="size-4 text-primary" />
            {star}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
