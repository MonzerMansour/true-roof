"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateListingSettings } from "@/lib/portal/actions"
import {
  couplesLabel,
  freshnessLabel,
  parkingStatusLabel,
  petsLabel,
} from "@/lib/listings/types"
import type {
  CouplesPolicy,
  Freshness,
  ParkingStatus,
  PetsPolicy,
  SiteKind,
} from "@/lib/listings/types"
import type { PortalListing, PortalOrganization } from "@/lib/portal/types"
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
import { Textarea } from "@/components/ui/textarea"

type ListingSettingsFormProps = {
  listing: PortalListing
  organization: PortalOrganization | null
  canManage: boolean
}

export function ListingSettingsForm({
  listing,
  organization,
  canManage,
}: ListingSettingsFormProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [kind, setKind] = React.useState<SiteKind>(listing.kind)
  const [intakeMethod, setIntakeMethod] = React.useState(
    listing.intakeMethod ?? "call"
  )
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
            <Field>
              <FieldLabel htmlFor="orgDescription">Short note (optional)</FieldLabel>
              <Textarea
                id="orgDescription"
                name="orgDescription"
                defaultValue={organization?.description ?? ""}
                rows={3}
                placeholder="Who runs this site, or how intake works. Not a category label."
              />
              <FieldDescription>
                Keep it brief. Seekers still see enums on the listing, not a
                free-text category.
              </FieldDescription>
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
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Input id="city" name="city" defaultValue={listing.city} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="lat">Latitude</FieldLabel>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="0.0001"
              defaultValue={listing.lat ?? ""}
              placeholder="37.3382"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lng">Longitude</FieldLabel>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="0.0001"
              defaultValue={listing.lng ?? ""}
              placeholder="-121.8863"
            />
          </Field>
        </div>
        <FieldDescription>
          Used to sort nearby sites. Leave empty if you do not know it yet.
        </FieldDescription>

        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input
            id="phone"
            name="phone"
            defaultValue={listing.phone ?? ""}
            placeholder="+14085550100"
          />
          <FieldDescription>
            Include the country code. Call-first sites need this.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="intakeMethod">How people get in</FieldLabel>
          <Select
            value={intakeMethod}
            onValueChange={(value) => {
              if (value) setIntakeMethod(value)
            }}
          >
            <SelectTrigger id="intakeMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call first</SelectItem>
              <SelectItem value="waitlist">Join waitlist</SelectItem>
              <SelectItem value="register">Ask for a bed</SelectItem>
              <SelectItem value="walk_up">Walk up</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="intakeMethod" value={intakeMethod} />
          <FieldDescription>
            Call opens the phone. Waitlist and ask for a bed need a True Roof
            account. Walk up is in person.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind">Site type</FieldLabel>
          <Select
            name="kind"
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
          <FieldLabel htmlFor="freshness">Freshness badge</FieldLabel>
          <Select name="freshness" defaultValue={listing.freshness}>
            <SelectTrigger id="freshness">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(freshnessLabel) as Freshness[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {freshnessLabel[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {kind === "shelter" ? (
          <>
            <Field>
              <FieldLabel htmlFor="pets">Pets</FieldLabel>
              <Select name="pets" defaultValue={listing.pets ?? undefined}>
                <SelectTrigger id="pets">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(petsLabel) as PetsPolicy[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {petsLabel[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="couples">Couples</FieldLabel>
              <Select name="couples" defaultValue={listing.couples ?? undefined}>
                <SelectTrigger id="couples">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(couplesLabel) as CouplesPolicy[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {couplesLabel[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="parkingStatus">Availability</FieldLabel>
              <Select
                name="parkingStatus"
                defaultValue={listing.parkingStatus ?? undefined}
              >
                <SelectTrigger id="parkingStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(parkingStatusLabel) as ParkingStatus[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {parkingStatusLabel[key]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="vehicleNote">Vehicle note</FieldLabel>
              <Input
                id="vehicleNote"
                name="vehicleNote"
                defaultValue={listing.vehicleNote ?? ""}
                placeholder="Max length, RVs, overnight rules"
              />
            </Field>
          </>
        )}

        {canManage ? (
          <Field className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FieldLabel htmlFor="published">Publish on the Places list</FieldLabel>
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

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save site details"}
        </Button>
      </FieldGroup>
    </form>
  )
}
