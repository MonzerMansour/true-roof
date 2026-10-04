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
  const [intakeMethod, setIntakeMethod] = React.useState<IntakeMethod>(
    listing.intakeMethod ?? "call"
  )
  const [curfewPolicy, setCurfewPolicy] = React.useState<CurfewPolicy | "">(
    listing.curfewPolicy ?? ""
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
            <Field>
              <FieldLabel htmlFor="orgDescription">
                Short note (optional)
              </FieldLabel>
              <Textarea
                id="orgDescription"
                name="orgDescription"
                defaultValue={organization?.description ?? ""}
                rows={3}
                placeholder="Who runs this site, or how intake works. Not a category label."
              />
              <FieldDescription>
                Keep it brief. Seekers still see set options on the listing, not
                a free-text category.
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

        <Field>
          <FieldLabel htmlFor="address">Street address (optional)</FieldLabel>
          <Input
            id="address"
            name="address"
            defaultValue={listing.address ?? ""}
            placeholder="2000 Geng Road, Palo Alto, CA"
          />
          <FieldDescription>
            Leave this empty for a site whose location should not be public.
          </FieldDescription>
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
          Used to sort nearby sites. Without these, people only see the distance
          to your city, not to your door.
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
              if (value) setIntakeMethod(value as IntakeMethod)
            }}
          >
            <SelectTrigger id="intakeMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>{optionsFrom(intakeLabel)}</SelectContent>
          </Select>
          <input type="hidden" name="intakeMethod" value={intakeMethod} />
          <FieldDescription>
            Call opens the phone. Waitlist and ask for a bed need a True Roof
            account. Walk up is in person.
          </FieldDescription>
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
          <FieldLabel htmlFor="freshness">Freshness badge</FieldLabel>
          <Select name="freshness" defaultValue={listing.freshness}>
            <SelectTrigger id="freshness">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {optionsFrom<Freshness>(freshnessLabel)}
            </SelectContent>
          </Select>
        </Field>

        {/* The rules a person is asked about in the questionnaire. Leaving one
            blank is fine and honest: the site page says it is not published and
            tells them to call, and the matcher never excludes on a blank. */}
        <Field>
          <FieldLabel htmlFor="idRequired">Photo ID</FieldLabel>
          <Select
            name="idRequired"
            defaultValue={listing.idRequired ?? undefined}
          >
            <SelectTrigger id="idRequired">
              <SelectValue placeholder="Not published yet" />
            </SelectTrigger>
            <SelectContent>
              {optionsFrom<IdRequired>(idRequiredOption)}
            </SelectContent>
          </Select>
          <FieldDescription>
            Case by case means you will work with someone who has no ID. It
            keeps your site in their results.
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="intakeFrom">Check-in starts</FieldLabel>
            <Input
              id="intakeFrom"
              name="intakeFrom"
              type="time"
              defaultValue={listing.intakeFrom ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="intakeTo">Check-in ends</FieldLabel>
            <Input
              id="intakeTo"
              name="intakeTo"
              type="time"
              defaultValue={listing.intakeTo ?? ""}
            />
          </Field>
        </div>
        <FieldDescription>
          Set both or neither. An end time earlier than the start means the
          window runs past midnight, which is fine.
        </FieldDescription>

        <Field>
          <FieldLabel htmlFor="curfewPolicy">Curfew</FieldLabel>
          <Select
            value={curfewPolicy}
            onValueChange={(value) => setCurfewPolicy(value as CurfewPolicy)}
          >
            <SelectTrigger id="curfewPolicy">
              <SelectValue placeholder="Not published yet" />
            </SelectTrigger>
            <SelectContent>
              {optionsFrom<CurfewPolicy>(curfewPolicyOption)}
            </SelectContent>
          </Select>
          <input type="hidden" name="curfewPolicy" value={curfewPolicy} />
        </Field>

        {curfewPolicy === "fixed_time" ? (
          <Field>
            <FieldLabel htmlFor="curfewTime">Doors lock at</FieldLabel>
            <Input
              id="curfewTime"
              name="curfewTime"
              type="time"
              defaultValue={listing.curfewTime ?? ""}
              required
            />
            <FieldDescription>
              Someone who cannot get there by this time will not see your site.
            </FieldDescription>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor="maxStay">Longest stay</FieldLabel>
          <Select name="maxStay" defaultValue={listing.maxStay ?? undefined}>
            <SelectTrigger id="maxStay">
              <SelectValue placeholder="Not published yet" />
            </SelectTrigger>
            <SelectContent>{optionsFrom<MaxStay>(maxStayOption)}</SelectContent>
          </Select>
          <FieldDescription>
            This never hides your site. Someone who needs longer still needs
            tonight.
          </FieldDescription>
        </Field>

        {kind === "shelter" ? (
          <>
            <Field>
              <FieldLabel htmlFor="pets">Pets</FieldLabel>
              <Select name="pets" defaultValue={listing.pets ?? undefined}>
                <SelectTrigger id="pets">
                  <SelectValue placeholder="Not published yet" />
                </SelectTrigger>
                <SelectContent>
                  {optionsFrom<PetsPolicy>(petsOption)}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="petWeightLimitLbs">
                Pet weight limit in pounds (optional)
              </FieldLabel>
              <Input
                id="petWeightLimitLbs"
                name="petWeightLimitLbs"
                type="number"
                min={1}
                max={200}
                defaultValue={listing.petWeightLimitLbs ?? ""}
                placeholder="25"
              />
              <FieldDescription>
                Only used when pets is set to small pets.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="couples">Couples</FieldLabel>
              <Select
                name="couples"
                defaultValue={listing.couples ?? undefined}
              >
                <SelectTrigger id="couples">
                  <SelectValue placeholder="Not published yet" />
                </SelectTrigger>
                <SelectContent>
                  {optionsFrom<CouplesPolicy>(couplesOption)}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="totalBeds">Total beds (optional)</FieldLabel>
              <Input
                id="totalBeds"
                name="totalBeds"
                type="number"
                min={0}
                defaultValue={listing.totalBeds ?? ""}
              />
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
                  <SelectValue placeholder="Not published yet" />
                </SelectTrigger>
                <SelectContent>
                  {optionsFrom<ParkingStatus>(parkingStatusLabel)}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="vehicleAllowed">Vehicles allowed</FieldLabel>
              <Select
                name="vehicleAllowed"
                defaultValue={listing.vehicleAllowed ?? undefined}
              >
                <SelectTrigger id="vehicleAllowed">
                  <SelectValue placeholder="Not published yet" />
                </SelectTrigger>
                <SelectContent>
                  {optionsFrom<VehicleAllowed>(vehicleAllowedOption)}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="vehicleMaxLengthFt">
                Longest vehicle in feet (optional)
              </FieldLabel>
              <Input
                id="vehicleMaxLengthFt"
                name="vehicleMaxLengthFt"
                type="number"
                min={8}
                max={60}
                defaultValue={listing.vehicleMaxLengthFt ?? ""}
                placeholder="22"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="registrationRequired">
                Registration and plates
              </FieldLabel>
              <Select
                name="registrationRequired"
                defaultValue={listing.registrationRequired ?? undefined}
              >
                <SelectTrigger id="registrationRequired">
                  <SelectValue placeholder="Not published yet" />
                </SelectTrigger>
                <SelectContent>
                  {optionsFrom<RegistrationRequired>(
                    registrationRequiredOption
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
                placeholder="Anything the options above do not cover"
              />
              <FieldDescription>
                Shown on the site page. The matcher uses the options above, not
                this note.
              </FieldDescription>
            </Field>
          </>
        )}

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

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save site details"}
        </Button>
      </FieldGroup>
    </form>
  )
}
