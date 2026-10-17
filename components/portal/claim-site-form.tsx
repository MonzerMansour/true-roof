"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconArrowRight } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  previewSiteTransferCode,
  redeemSiteTransferCode,
} from "@/lib/portal/actions"
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
 * Take over a site with a transfer code.
 *
 * Two steps on purpose. Entering a code shows which site it is and which
 * organization it comes from, and only then is there a button that actually
 * moves it. A transfer cannot be undone from this side: once the site is
 * yours, the organization that gave it up has no rights over it and cannot
 * take it back without you issuing a code in return. That is too much to hang
 * on one press of a button on a code somebody read out over the phone.
 */
export function ClaimSiteForm() {
  const router = useRouter()
  const [state, formAction, checking] = React.useActionState(
    previewSiteTransferCode,
    null
  )
  const [code, setCode] = React.useState("")
  const [claiming, setClaiming] = React.useState(false)

  // The preview belongs to the code that was checked. Editing the box after
  // that would otherwise leave a confirmation for one site above a box
  // holding the code of another.
  const [checkedCode, setCheckedCode] = React.useState("")
  const confirmed = state?.ok && checkedCode === code.trim().toUpperCase()

  async function claim() {
    setClaiming(true)
    try {
      const result = await redeemSiteTransferCode(code.trim())
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.listingName} is now yours to edit.`)
      router.push(`/portal/sites/${result.listingId}/settings`)
      router.refresh()
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        action={(data) => {
          setCheckedCode(String(data.get("transferCode") ?? "").trim().toUpperCase())
          formAction(data)
        }}
      >
        <FieldGroup className="gap-5">
          <Field data-invalid={state && !state.ok ? true : undefined}>
            <FieldLabel htmlFor="transferCode">Site transfer code</FieldLabel>
            <Input
              id="transferCode"
              name="transferCode"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="font-mono text-lg tracking-widest uppercase"
              placeholder="AB12CD34"
            />
            <FieldDescription>
              Eight characters, from the director of the organization that runs
              the site now. This is not the same as the code for joining their
              staff.
            </FieldDescription>
            {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
          </Field>

          <Button
            type="submit"
            variant="outline"
            size="touch"
            disabled={checking || !code.trim()}
            className="w-fit"
          >
            {checking ? "Checking…" : "Check this code"}
          </Button>
        </FieldGroup>
      </form>

      {confirmed && state.ok ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="font-medium">{state.listingName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Currently run by {state.fromOrganization}. Taking it over moves the
            site to your organization: you become responsible for what seekers
            are told about it, and {state.fromOrganization} can no longer edit
            it. Everything already on the listing stays, including its saved
            places, requests and reviews.
          </p>
          <Button
            type="button"
            size="touch"
            className="mt-4 w-full sm:w-auto"
            disabled={claiming}
            onClick={() => void claim()}
          >
            {claiming ? "Moving the site…" : `Take over ${state.listingName}`}
            {claiming ? null : <IconArrowRight />}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
