"use client"

import * as React from "react"
import { toast } from "sonner"

import { createOrganizationWithSite } from "@/lib/portal/actions"
import type { SiteKind } from "@/lib/listings/types"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function CreateSiteForm() {
  const [pending, setPending] = React.useState(false)
  const [kind, setKind] = React.useState<SiteKind>("shelter")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(event.currentTarget)
      // On success the action redirects to the new site settings, so control
      // only returns here when something went wrong.
      const result = await createOrganizationWithSite(formData)
      if (result && !result.ok) {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup className="gap-6">
        <Field>
          <FieldLabel htmlFor="orgName">Organization name</FieldLabel>
          <Input
            id="orgName"
            name="orgName"
            placeholder="Downtown Streets Team"
            required
          />
          <FieldDescription>
            The group that runs the site. Staff join this org later with an
            access code.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Short note (optional)</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Who runs this site, or how intake works. Not a category label."
          />
          <FieldDescription>
            Keep it brief. Seekers still see enums on the listing, not a
            free-text category.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="siteName">Site name</FieldLabel>
          <Input
            id="siteName"
            name="siteName"
            placeholder="First Street Shelter"
            required
          />
          <FieldDescription>One row per physical address.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind">Site type</FieldLabel>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as SiteKind)}
          >
            <SelectTrigger id="kind">
              <SelectValue placeholder="Pick a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shelter">Shelter</SelectItem>
              <SelectItem value="parking">Safe parking</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="kind" value={kind} />
        </Field>

        <Field>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Input id="city" name="city" defaultValue="San Jose" required />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create site"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Your site starts as a draft. It stays off the homepage until you
            publish it.
          </p>
        </div>
      </FieldGroup>
    </form>
  )
}
