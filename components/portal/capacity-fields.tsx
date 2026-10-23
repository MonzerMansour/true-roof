import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ALMOST_FULL_AT,
  MAX_PEOPLE_LIMIT,
} from "@/lib/listings/availability"
import type { SiteKind } from "@/lib/listings/types"

/**
 * The two numbers that say how full a site is: the most people it can hold and
 * how many are there now. They sit with the main fields rather than under
 * Additional info because every site has to answer them, and because the
 * second one is the one staff come back to change.
 *
 * The field names are the ones the save already reads: totalBeds is the
 * existing total_beds column, currentPeople is current_people.
 */
export function CapacityFields({
  kind,
  totalBeds,
  currentPeople,
  required,
}: {
  kind: SiteKind
  totalBeds?: number | null
  currentPeople?: number | null
  /** A new site, or a draft being published, has to answer both. */
  required: boolean
}) {
  const unit = kind === "parking" ? "spaces" : "beds"

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
        />
        <FieldDescription>
          Count the {unit}, not the staff.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="currentPeople">
          People there now{required ? "" : " (optional)"}
        </FieldLabel>
        <Input
          id="currentPeople"
          name="currentPeople"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_PEOPLE_LIMIT}
          required={required}
          defaultValue={currentPeople ?? ""}
          placeholder="12"
        />
        <FieldDescription>
          Change it as people come and go. At {ALMOST_FULL_AT} spots left or
          fewer, people see &ldquo;Almost full&rdquo;.
        </FieldDescription>
      </Field>
    </div>
  )
}
