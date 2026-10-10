"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateListingSettings } from "@/lib/portal/actions"
import {
  couplesOption,
  curfewPolicyOption,
  freshnessLabel,
  idRequiredOption,
  intakeLabel,
  maxStayOption,
  parkingStatusLabel,
  petsOption,
  registrationRequiredOption,
  vehicleAllowedOption,
} from "@/lib/listings/types"
import type {
  CouplesPolicy,
  CurfewPolicy,
  Freshness,
  IdRequired,
  IntakeMethod,
  MaxStay,
  ParkingStatus,
  PetsPolicy,
  RegistrationRequired,
  SiteKind,
  VehicleAllowed,
} from "@/lib/listings/types"
import type { PortalListing, PortalOrganization } from "@/lib/portal/types"
import { OptionalSiteFields } from "@/components/portal/optional-site-fields"
import { SitePhotoField } from "@/components/portal/site-photo-field"
import { VoiceTextarea } from "@/components/voice/voice-textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"

type ListingSettingsFormProps = {
  listing: PortalListing
  organization: PortalOrganization | null
  canManage: boolean
}

/** Renders the options for an enum from its option map, so a value can never
 * exist in the database with no way for staff to pick it. */
function optionsFrom<T extends string>(map: Record<T, string>) {
  return (Object.keys(map) as T[]).map((key) => (
    <SelectItem key={key} value={key}>
      {map[key]}
    </SelectItem>
  ))
}

export function ListingSettingsForm({
  listing,
  organization,
  canManage,
}: ListingSettingsFormProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [kind, setKind] = React.useState<SiteKind>(listing.kind)
  const [published, setPublished] = React.useState(listing.published)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(event.currentTarget)
      if (published) {
        formData.set("published", "on")
      } else {
        formData.delete("published")
      }

      const result = await updateListingSettings(listing.id, formData)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Site details saved.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup className="gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={published ? "default" : "secondary"}>
            {published ? "Published" : "Draft"}
          </Badge>
          {!published ? (
            <p className="text-sm text-muted-foreground">
              Draft listings stay off the public homepage until you publish.
            </p>
          ) : null}
        </div>

        {listing.dataSource && listing.dataSource !== "provider_portal" ? (
          <p className="rounded-lg border bg-muted/40 p-4 text-sm">
            This site was imported from a public list, so most of its rules are
            blank. Anything you fill in below replaces the imported record and
            people stop being told to call the county to ask.
          </p>
        ) : null}

        {canManage ? (
          <>
            <Field>
              <FieldLabel htmlFor="orgName">Organization name</FieldLabel>
              <Input
                id="orgName"
                name="orgName"
                defaultValue={organization?.name ?? ""}
                required
              />
            </Field>
          </>
        ) : null}

        <Field>
          <FieldLabel htmlFor="siteName">Site name</FieldLabel>
          <Input
            id="siteName"
            name="siteName"
            defaultValue={listing.name}
            required
          />
          <FieldDescription>One row per physical address.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind">Site type</FieldLabel>
          {/* No name on the Select. The hidden input below is the single
              authoritative entry. Having both put two "kind" values in one
              FormData, and formData.get returned whichever came first. */}
          <Select
            value={kind}
            onValueChange={(value) => {
              if (value) setKind(value as SiteKind)
            }}
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
          <Input id="city" name="city" defaultValue={listing.city} required />
        </Field>

        <Field>
          <FieldLabel htmlFor="siteDescription">
            About this site (optional)
          </FieldLabel>
          <VoiceTextarea
            label="About this site"
            id="siteDescription"
            name="siteDescription"
            defaultValue={listing.description ?? ""}
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

        <SitePhotoField listingId={listing.id} photoUrl={listing.photoUrl} />

        {canManage ? (
          <Field className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FieldLabel htmlFor="published">
                Publish on the Places list
              </FieldLabel>
              <FieldDescription>
                Seekers see published sites on /places. Featured placement on
                the homepage is still a separate flag.
              </FieldDescription>
            </div>
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
          </Field>
        ) : null}

        <OptionalSiteFields
          listing={listing}
          kind={kind}
          orgDescription={organization?.description}
          showOrgNote={canManage}
        />

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save site details"}
        </Button>
      </FieldGroup>
    </form>
  )
}
