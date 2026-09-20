"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { requestJoinOrganization } from "@/lib/portal/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function JoinOrgForm() {
  const router = useRouter()
  const [state, formAction, pending] = React.useActionState(
    requestJoinOrganization,
    null
  )

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Request sent. A director has to accept it.")
      router.push("/portal")
    }
  }, [state, router])

  return (
    <form action={formAction} className="max-w-md">
      <FieldGroup className="gap-5">
        <Field data-invalid={state && !state.ok ? true : undefined}>
          <FieldLabel htmlFor="accessCode">Access code</FieldLabel>
          <Input
            id="accessCode"
            name="accessCode"
            required
            autoComplete="off"
            autoCapitalize="characters"
            className="font-mono text-lg tracking-widest uppercase"
            placeholder="AB12CD34"
          />
          <FieldDescription>
            Ask the site director for the code. It is eight characters.
          </FieldDescription>
          {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
        </Field>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Sending…" : "Request access"}
        </Button>
      </FieldGroup>
    </form>
  )
}
