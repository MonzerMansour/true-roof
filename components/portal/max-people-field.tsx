import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MAX_PEOPLE_LIMIT } from "@/lib/listings/availability"
import type { SiteKind } from "@/lib/listings/types"

/**
 * The most people the site can hold, with the main fields rather than under
 * Additional info because every site has to answer it. The field name is the
 * one the save already reads: totalBeds is the existing total_beds column.
 */
export function MaxPeopleField({
  kind,
  totalBeds,
  required,
}: {
  kind: SiteKind
  totalBeds?: number | null
  /** A new site, or a draft being published, has to answer it. */
  required: boolean
}) {
  const unit = kind === "parking" ? "spaces" : "beds"

  return (
    <Field>
      <FieldLabel htmlFor="totalBeds">
        Most people it can hold{required ? "" : " (optional)"}
      </FieldLabel>
      <Input
        id="totalBeds"
        name="totalBeds"
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_PEOPLE_LIMIT}
        required={required}
        defaultValue={totalBeds ?? ""}
        placeholder="40"
        className="sm:max-w-xs"
      />
      <FieldDescription>Count the {unit}, not the staff.</FieldDescription>
    </Field>
  )
}
