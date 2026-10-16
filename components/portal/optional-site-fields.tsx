"use client"

import * as React from "react"

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
import type { PortalListing } from "@/lib/portal/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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

/** Renders the options for an enum from its option map, so a value can never
 * exist in the database with no way for staff to pick it. */
function optionsFrom<T extends string>(map: Record<T, string>) {
  return (Object.keys(map) as T[]).map((key) => (
    <SelectItem key={key} value={key}>
      {map[key]}
    </SelectItem>
  ))
}

/**
 * Every optional site detail, in one "Additional info" dropdown. Used both
 * while creating a site (nothing filled in yet) and on its settings page, so
 * staff can add these at the start or come back to them. All of it posts with
 * the surrounding form; the create form saves it right after the site exists.
 */
export function OptionalSiteFields({
  listing,
  kind,
  orgDescription,
  showOrgNote,
}: {
  /** The saved site, or undefined while creating one. */
  listing?: PortalListing
  kind: SiteKind
  orgDescription?: string | null
  /** The org's short note. Only for people who can edit the organization. */
  showOrgNote: boolean
}) {
  const [intakeMethod, setIntakeMethod] = React.useState<IntakeMethod>(
    listing?.intakeMethod ?? "call"
  )
  const [curfewPolicy, setCurfewPolicy] = React.useState<CurfewPolicy | "">(
    listing?.curfewPolicy ?? ""
  )

  // Starts collapsed. keepMounted keeps these fields in the form while
  // closed, so saving with the section shut never blanks them.
  return (
    <div className="grid gap-2">
      <div>
        <p className="font-heading text-base font-medium">
          Additional info (optional)
        </p>
        <p className="text-sm text-muted-foreground">
          Open a section to add or change it. Anything left blank shows as not
          published, and people are told to call.
        </p>
      </div>
      <Accordion multiple className="rounded-lg border px-4">
        {showOrgNote ? (
          <AccordionItem value="organization">
            <AccordionTrigger className="text-base">
              <span className="grid gap-0.5">
                <span>Organization note</span>
                <span className="text-sm font-normal text-muted-foreground">
                  A short note about who runs this site
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="pt-2 pb-4">
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="orgDescription">
                    Short note (optional)
                  </FieldLabel>
                  <VoiceTextarea
                    label="Organization short note"
                    id="orgDescription"
                    name="orgDescription"
                    defaultValue={orgDescription ?? ""}
                    rows={3}
                    placeholder="Who runs this site, or how intake works. Not a category label."
                  />
                  <FieldDescription>
                    Keep it brief. Seekers still see set options on the listing,
                    not a free-text category.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </AccordionContent>
          </AccordionItem>
        ) : null}
        <AccordionItem value="location">
          <AccordionTrigger className="text-base">
            <span className="grid gap-0.5">
              <span>Location and contact</span>
              <span className="text-sm font-normal text-muted-foreground">
                Address, map spot, and phone
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent keepMounted className="pt-2 pb-4">
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="address">
                  Street address (optional)
                </FieldLabel>
                <Input
                  id="address"
                  name="address"
                  defaultValue={listing?.address ?? ""}
                  placeholder="2000 Geng Road, Palo Alto, CA"
                />
                <FieldDescription>
                  Leave this empty for a site whose location should not be
                  public.
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
                    defaultValue={listing?.lat ?? ""}
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
                    defaultValue={listing?.lng ?? ""}
                    placeholder="-121.8863"
                  />
                </Field>
              </div>
              <FieldDescription>
                Used to sort nearby sites. Without these, people only see the
                distance to your city, not to your door.
              </FieldDescription>

              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={listing?.phone ?? ""}
                  placeholder="+14085550100"
                />
                <FieldDescription>
                  Include the country code. Call-first sites need this.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="intake">
          <AccordionTrigger className="text-base">
            <span className="grid gap-0.5">
              <span>How people get in</span>
              <span className="text-sm font-normal text-muted-foreground">
                Intake, ID, check-in hours, curfew, and longest stay
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent keepMounted className="pt-2 pb-4">
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="intakeMethod">
                  How people get in
                </FieldLabel>
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
                  Call opens the phone. Waitlist and ask for a bed need a True
                  Roof account. Walk up is in person.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="freshness">Freshness badge</FieldLabel>
                <Select
                  name="freshness"
                  defaultValue={listing?.freshness ?? "call_first"}
                >
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
                  defaultValue={listing?.idRequired ?? undefined}
                >
                  <SelectTrigger id="idRequired">
                    <SelectValue placeholder="Not published yet" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsFrom<IdRequired>(idRequiredOption)}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Case by case means you will work with someone who has no ID.
                  It keeps your site in their results.
                </FieldDescription>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="intakeFrom">Check-in starts</FieldLabel>
                  <Input
                    id="intakeFrom"
                    name="intakeFrom"
                    type="time"
                    defaultValue={listing?.intakeFrom ?? ""}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="intakeTo">Check-in ends</FieldLabel>
                  <Input
                    id="intakeTo"
                    name="intakeTo"
                    type="time"
                    defaultValue={listing?.intakeTo ?? ""}
                  />
                </Field>
              </div>
              <FieldDescription>
                Set both or neither. An end time earlier than the start means
                the window runs past midnight, which is fine.
              </FieldDescription>

              <Field>
                <FieldLabel htmlFor="curfewPolicy">Curfew</FieldLabel>
                <Select
                  value={curfewPolicy}
                  onValueChange={(value) =>
                    setCurfewPolicy(value as CurfewPolicy)
                  }
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
                    defaultValue={listing?.curfewTime ?? ""}
                  />
                  <FieldDescription>
                    Someone who cannot get there by this time will not see your
                    site.
                  </FieldDescription>
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="maxStay">Longest stay</FieldLabel>
                <Select
                  name="maxStay"
                  defaultValue={listing?.maxStay ?? undefined}
                >
                  <SelectTrigger id="maxStay">
                    <SelectValue placeholder="Not published yet" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsFrom<MaxStay>(maxStayOption)}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  This never hides your site. Someone who needs longer still
                  needs tonight.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>
        {kind === "shelter" ? (
          <AccordionItem value="details">
            <AccordionTrigger className="text-base">
              <span className="grid gap-0.5">
                <span>Shelter details</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Pets, couples, and beds
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="pt-2 pb-4">
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="pets">Pets</FieldLabel>
                  <Select name="pets" defaultValue={listing?.pets ?? undefined}>
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
                    defaultValue={listing?.petWeightLimitLbs ?? ""}
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
                    defaultValue={listing?.couples ?? undefined}
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
                  <FieldLabel htmlFor="totalBeds">
                    Total beds (optional)
                  </FieldLabel>
                  <Input
                    id="totalBeds"
                    name="totalBeds"
                    type="number"
                    min={0}
                    defaultValue={listing?.totalBeds ?? ""}
                  />
                </Field>
              </FieldGroup>
            </AccordionContent>
          </AccordionItem>
        ) : (
          <AccordionItem value="details">
            <AccordionTrigger className="text-base">
              <span className="grid gap-0.5">
                <span>Parking details</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Availability, vehicles, and registration
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="pt-2 pb-4">
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="parkingStatus">Availability</FieldLabel>
                  <Select
                    name="parkingStatus"
                    defaultValue={listing?.parkingStatus ?? undefined}
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
                  <FieldLabel htmlFor="vehicleAllowed">
                    Vehicles allowed
                  </FieldLabel>
                  <Select
                    name="vehicleAllowed"
                    defaultValue={listing?.vehicleAllowed ?? undefined}
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
                    defaultValue={listing?.vehicleMaxLengthFt ?? ""}
                    placeholder="22"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="registrationRequired">
                    Registration and plates
                  </FieldLabel>
                  <Select
                    name="registrationRequired"
                    defaultValue={listing?.registrationRequired ?? undefined}
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
                    defaultValue={listing?.vehicleNote ?? ""}
                    placeholder="Anything the options above do not cover"
                  />
                  <FieldDescription>
                    Shown on the site page. The matcher uses the options above,
                    not this note.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}
