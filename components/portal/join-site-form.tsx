"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { joinListingWithCode } from "@/lib/portal/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/**
 * Enter a site's code to help run it.
 *
 * No approval step, unlike the old organization code. The code is the
 * permission: a director hands it to one person for one site, and that is a
 * smaller thing to grant than the run of a whole organization, which is what
 * the approval step existed to guard.
 */
export function JoinSiteForm() {
  const router = useRouter()
  const [state, formAction, pending] = React.useActionState(
    joinListingWithCode,
    null
  )

  React.useEffect(() => {
    if (state?.ok) {
      toast.success(`${state.listingName} is on your dashboard now.`)
      router.push(`/portal/sites/${state.listingId}/settings`)
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="max-w-md">
      <FieldGroup className="gap-5">
        <Field data-invalid={state && !state.ok ? true : undefined}>
          <FieldLabel htmlFor="siteCode">Site code</FieldLabel>
          <Input
            id="siteCode"
            name="siteCode"
            required
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono text-lg tracking-widest uppercase"
            placeholder="AB2CD3EF"
          />
          <FieldDescription>
            Eight characters, from whoever runs the site. It is on their Site
            details page.
          </FieldDescription>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </Field>

        <Button type="submit" size="touch" disabled={pending} className="w-fit">
          {pending ? "Checking…" : "Add this site"}
        </Button>
      </FieldGroup>
    </form>
  )
}
