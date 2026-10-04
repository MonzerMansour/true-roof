"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { defaultCity } from "@/lib/listings/geo"
import {
  couplesPolicyValues,
  curfewPolicyValues,
  freshnessValues,
  idRequiredValues,
  intakeMethodValues,
  maxStayValues,
  parkingStatusValues,
  petsPolicyValues,
  registrationRequiredValues,
  siteKindValues,
  vehicleAllowedValues,
  type Freshness,
  type SiteKind,
} from "@/lib/listings/types"
import { requireProviderSession } from "@/lib/portal/queries"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Read a FormData field and keep it only if it is a real member of the enum.
 *
 * An empty select posts "", which used to be cast straight to the union with
 * `as` and then rejected by the database check constraint, failing the whole
 * save with a Postgres error. Anything unrecognised becomes null, which is what
 * "not published yet" means everywhere else. */
function readEnum<T extends readonly string[]>(
  formData: FormData,
  field: string,
  values: T
): T[number] | null {
  const raw = String(formData.get(field) ?? "").trim()
  return (values as readonly string[]).includes(raw) ? (raw as T[number]) : null
}

/** A real "HH:MM" on a 24 hour clock. Inlined rather than imported: the
 * matcher's time helpers belonged to the ranking approach that was dropped in
 * favour of the embeddings matcher, but the portal still has to reject a
 * malformed curfew before it reaches a `time` column. */
function isHHMM(value: string): boolean {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return false
  return Number(match[1]) <= 23 && Number(match[2]) <= 59
}

/** A time field, kept only when it is a real HH:MM. */
function readTime(formData: FormData, field: string): string | null {
  const raw = String(formData.get(field) ?? "").trim()
  return isHHMM(raw) ? raw : null
}

/** A whole number inside a range, or null. */
function readInt(
  formData: FormData,
  field: string,
  min: number,
  max: number
): number | null {
  const raw = String(formData.get(field) ?? "").trim()
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null
  return value >= min && value <= max ? value : null
}

export async function createOrganizationWithSite(formData: FormData) {
  const orgName = String(formData.get("orgName") ?? "")
  // Named orgDescription, matching the settings form. Both write the same
  // organizations.description column and used to disagree about the field name.
  const description = String(formData.get("orgDescription") ?? "")
  const siteName = String(formData.get("siteName") ?? "")
  const kind = readEnum(formData, "kind", siteKindValues) ?? "shelter"
  const city = String(formData.get("city") ?? defaultCity)

  const { supabase } = await requireProviderSession()

  const { data, error } = await supabase.rpc("create_organization_with_site", {
    p_org_name: orgName,
    p_description: description,
    p_site_name: siteName,
    p_kind: kind,
    p_city: city,
  })

  if (error) {
    return { ok: false as const, error: error.message }
  }

  const row = Array.isArray(data) ? data[0] : data
  const listingId = row?.listing_id as string | undefined

  revalidatePath("/portal")

  if (listingId) {
    redirect(`/portal/sites/${listingId}/settings`)
  }

  redirect("/portal")
}

export async function requestJoinOrganization(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const code = String(formData.get("accessCode") ?? "")

  const { supabase } = await requireProviderSession()

  const { error } = await supabase.rpc("request_join_organization", {
    p_code: code,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/portal")
  revalidatePath("/portal/join")
  return { ok: true }
}

export async function updateListingSettings(
  listingId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireProviderSession()

  // kind and freshness come back too: they are the fallback when a Select
  // posts nothing, so that a partial save cannot blank a NOT NULL column.
  const { data: listing } = await supabase
    .from("listings")
    .select("organization_id, published, kind, freshness")
    .eq("id", listingId)
    .maybeSingle()

  if (!listing) {
    return { ok: false, error: "Listing not found." }
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", listing.organization_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return { ok: false, error: "You do not have access to this site." }
  }

  const canManage =
    membership.role === "director" || membership.role === "manager"

  const orgName = String(formData.get("orgName") ?? "")
  const orgDescription = String(formData.get("orgDescription") ?? "")
  const siteName = String(formData.get("siteName") ?? "")
  const city = String(formData.get("city") ?? "")
  const address = String(formData.get("address") ?? "")
  const vehicleNote = String(formData.get("vehicleNote") ?? "")
  const phone = String(formData.get("phone") ?? "")

  const kind: SiteKind =
    readEnum(formData, "kind", siteKindValues) ?? (listing.kind as SiteKind)
  const freshness: Freshness =
    readEnum(formData, "freshness", freshnessValues) ??
    (listing.freshness as Freshness)
  const pets = readEnum(formData, "pets", petsPolicyValues)
  const couples = readEnum(formData, "couples", couplesPolicyValues)
  const parkingStatus = readEnum(formData, "parkingStatus", parkingStatusValues)
  const intakeMethod = readEnum(formData, "intakeMethod", intakeMethodValues)
  const idRequired = readEnum(formData, "idRequired", idRequiredValues)
  const curfewPolicy = readEnum(formData, "curfewPolicy", curfewPolicyValues)
  const maxStay = readEnum(formData, "maxStay", maxStayValues)
  const vehicleAllowed = readEnum(
    formData,
    "vehicleAllowed",
    vehicleAllowedValues
  )
  const registrationRequired = readEnum(
    formData,
    "registrationRequired",
    registrationRequiredValues
  )

  // A curfew time only means something alongside a fixed_time policy, and the
  // database enforces that pairing, so drop a stray time rather than fail the
  // save.
  const curfewTime =
    curfewPolicy === "fixed_time" ? readTime(formData, "curfewTime") : null
  // Both ends of the window travel together, also enforced in SQL. A window
  // whose end is before its start is legal: it wraps past midnight.
  const intakeFromRaw = readTime(formData, "intakeFrom")
  const intakeToRaw = readTime(formData, "intakeTo")
  const hasWindow = intakeFromRaw !== null && intakeToRaw !== null
  const intakeFrom = hasWindow ? intakeFromRaw : null
  const intakeTo = hasWindow ? intakeToRaw : null

  const petWeightLimitLbs = readInt(formData, "petWeightLimitLbs", 1, 200)
  const vehicleMaxLengthFt = readInt(formData, "vehicleMaxLengthFt", 8, 60)
  const totalBeds = readInt(formData, "totalBeds", 0, 10000)

  const latRaw = String(formData.get("lat") ?? "")
  const lngRaw = String(formData.get("lng") ?? "")
  const publishRequested = formData.get("published") === "on"

  // A curfew that is not a fixed time cannot also carry one, and an open lot
  // should not claim a waitlist intake. Tell staff rather than silently
  // rewriting what they chose.
  if (curfewPolicy === "fixed_time" && !curfewTime) {
    return {
      ok: false,
      error: "Add the time the doors lock, or pick No curfew.",
    }
  }
  if (intakeFromRaw !== null && intakeToRaw === null) {
    return { ok: false, error: "Add the time check-in ends." }
  }
  if (intakeToRaw !== null && intakeFromRaw === null) {
    return { ok: false, error: "Add the time check-in starts." }
  }
  if (
    kind === "parking" &&
    parkingStatus === "open" &&
    intakeMethod === "waitlist"
  ) {
    return {
      ok: false,
      error:
        "This lot is marked open but intake says join waitlist. Pick one so people are not sent the wrong way.",
    }
  }

  let published = listing.published
  if (publishRequested !== listing.published) {
    if (!canManage) {
      return {
        ok: false,
        error: "Only a director or manager can publish the listing.",
      }
    }
    published = publishRequested
  }

  if (canManage && orgName.trim()) {
    const { error: orgError } = await supabase
      .from("organizations")
      .update({
        name: orgName.trim(),
        description: orgDescription.trim() || null,
      })
      .eq("id", listing.organization_id)

    if (orgError) {
      return { ok: false, error: orgError.message }
    }
  }

  const lat = latRaw.trim() ? Number(latRaw) : null
  const lng = lngRaw.trim() ? Number(lngRaw) : null

  const { error } = await supabase
    .from("listings")
    .update({
      name: siteName.trim(),
      city: city.trim() || defaultCity,
      address: address.trim() || null,
      kind,
      freshness,
      pets: kind === "shelter" ? pets : null,
      couples: kind === "shelter" ? couples : null,
      parking_status: kind === "parking" ? parkingStatus : null,
      vehicle_note: kind === "parking" ? vehicleNote.trim() || null : null,
      vehicle_allowed: kind === "parking" ? vehicleAllowed : null,
      vehicle_max_length_ft: kind === "parking" ? vehicleMaxLengthFt : null,
      registration_required: kind === "parking" ? registrationRequired : null,
      pet_weight_limit_lbs: kind === "shelter" ? petWeightLimitLbs : null,
      id_required: idRequired,
      curfew_policy: curfewPolicy,
      curfew_time: curfewTime,
      intake_from: intakeFrom,
      intake_to: intakeTo,
      max_stay: maxStay,
      total_beds: totalBeds,
      phone: phone.trim() || null,
      intake_method: intakeMethod,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      published,
      // Staff touched this row, so it is theirs now rather than the imported
      // source's. Recording that is what lets the seeker page stop saying
      // "HUD does not publish this".
      data_source: "provider_portal",
      source_as_of: new Date().toISOString().slice(0, 10),
      last_confirmed_at: new Date().toISOString(),
    })
    .eq("id", listingId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(`/portal/sites/${listingId}/settings`)
  revalidatePath("/portal")
  revalidatePath("/")
  return { ok: true }
}

export async function approveMemberRequest(
  memberId: string,
  role: "staff" | "manager" = "staff"
): Promise<ActionResult> {
  const { supabase } = await requireProviderSession()

  const { error } = await supabase.rpc("approve_member", {
    p_member_id: memberId,
    p_role: role,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/portal/access")
  revalidatePath("/portal")
  return { ok: true }
}

export async function rejectMemberRequest(
  memberId: string
): Promise<ActionResult> {
  const { supabase } = await requireProviderSession()

  const { error } = await supabase.rpc("reject_member", {
    p_member_id: memberId,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/portal/access")
  return { ok: true }
}

export async function rotateAccessCode(
  orgId: string
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const { supabase } = await requireProviderSession()

  const { data, error } = await supabase.rpc(
    "rotate_organization_access_code",
    {
      p_org_id: orgId,
    }
  )

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/portal/access")
  return { ok: true, code: data as string }
}

export async function fetchAccessCode(orgId: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.rpc("get_organization_access_code", {
    p_org_id: orgId,
  })

  if (error) return null
  return data as string
}
