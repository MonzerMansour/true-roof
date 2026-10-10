"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { PhotoCapture } from "@/components/dashboard/photo-capture"

import {
  addSiteToOrganization,
  createOrganizationWithSite,
  updateListingSettings,
} from "@/lib/portal/actions"
import { OptionalSiteFields } from "@/components/portal/optional-site-fields"
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
import { VoiceTextarea } from "@/components/voice/voice-textarea"

// "new-org" creates an organization and its first site. "add-site" adds
// another site to the organization the person already manages.
export function CreateSiteForm({
  mode = "new-org",
}: {
  mode?: "new-org" | "add-site"
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [kind, setKind] = React.useState<SiteKind>("shelter")
  // Held on the page until the site exists, then uploaded to it.
  const [photo, setPhoto] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result =
        mode === "add-site"
          ? await addSiteToOrganization(formData)
          : await createOrganizationWithSite(formData)

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (!result.listingId) {
        router.push("/portal")
        return
      }

      // Anything filled in under Additional info. The create step only makes
      // the bare site, so the same save the settings page uses writes the rest.
      // The site exists either way; a failure here is said, not hidden.
      const details = await updateListingSettings(result.listingId, formData)
      if (!details.ok) {
        toast.error(`Site saved, but some details were not. ${details.error}`)
      }

      // The site is saved either way. A failed photo is said plainly and can
      // be added again from the site's settings.
      if (photo) {
        const response = await fetch(
          `/api/portal/sites/${result.listingId}/photo`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: photo }),
          }
        ).catch(() => null)
        if (!response?.ok) {
          const body = (await response?.json().catch(() => null)) as {
            error?: string
          } | null
          toast.error(
            `Site saved, but the photo was not. ${body?.error ?? "Try again from the site's settings."}`
          )
        }
      }

      toast.success("Site saved as a draft.")
      router.push(`/portal/sites/${result.listingId}/settings`)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup className="gap-6">
        {mode === "new-org" ? (
          <>
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
          </>
        ) : null}

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
          <FieldLabel htmlFor="siteDescription">
            About this site (optional)
          </FieldLabel>
          <VoiceTextarea
            label="About this site"
            id="siteDescription"
            name="siteDescription"
            rows={4}
            maxLength={1000}
            placeholder="What it is like to stay here, what is nearby, and what to expect at intake."
          />
          <FieldDescription>
            Shown on this site&apos;s page. People looking for a place read it,
            and it helps match them to sites like this one. Up to 1,000
            characters.
          </FieldDescription>
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

        <Field>
          <FieldLabel>Site photo (optional)</FieldLabel>
          <FieldDescription>
            The outside or the entrance. It shows on this site&apos;s card,
            page, and the homepage. Avoid photos where people can be recognized.
          </FieldDescription>
          {photo ? (
            <div className="grid gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not uploaded yet */}
              <img
                src={photo}
                alt="The site photo you picked"
                className="aspect-video w-full max-w-xl rounded-lg bg-muted object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setPhoto(null)}
              >
                <IconX />
                Remove photo
              </Button>
            </div>
          ) : (
            <PhotoCapture onPhoto={setPhoto} />
          )}
        </Field>

        <OptionalSiteFields kind={kind} showOrgNote={mode === "new-org"} />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending
              ? "Creating…"
              : mode === "add-site"
                ? "Add site"
                : "Create site"}
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
