"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type {
  CouplesPolicy,
  Freshness,
  ParkingStatus,
  PetsPolicy,
  SiteKind,
} from "@/lib/listings/types"
import { requireProviderSession } from "@/lib/portal/queries"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createOrganizationWithSite(formData: FormData) {
  const orgName = String(formData.get("orgName") ?? "")
  const description = String(formData.get("description") ?? "")
  const siteName = String(formData.get("siteName") ?? "")
  const kind = String(formData.get("kind") ?? "") as SiteKind
  const city = String(formData.get("city") ?? "San Jose")

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

  const { data: listing } = await supabase
    .from("listings")
    .select("organization_id, published")
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
  const kind = String(formData.get("kind") ?? "") as SiteKind
  const freshness = String(formData.get("freshness") ?? "") as Freshness
  const petsRaw = String(formData.get("pets") ?? "")
  const couplesRaw = String(formData.get("couples") ?? "")
  const parkingRaw = String(formData.get("parkingStatus") ?? "")
  const vehicleNote = String(formData.get("vehicleNote") ?? "")
  const publishRequested = formData.get("published") === "on"

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

  const pets = petsRaw ? (petsRaw as PetsPolicy) : null
  const couples = couplesRaw ? (couplesRaw as CouplesPolicy) : null
  const parkingStatus = parkingRaw ? (parkingRaw as ParkingStatus) : null

  const { error } = await supabase
    .from("listings")
    .update({
      name: siteName.trim(),
      city: city.trim() || "San Jose",
      kind,
      freshness,
      pets,
      couples,
      parking_status: kind === "parking" ? parkingStatus : null,
      vehicle_note: kind === "parking" ? vehicleNote.trim() || null : null,
      published,
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

export async function rejectMemberRequest(memberId: string): Promise<ActionResult> {
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

export async function rotateAccessCode(orgId: string): Promise<
  | { ok: true; code: string }
  | { ok: false; error: string }
> {
  const { supabase } = await requireProviderSession()

  const { data, error } = await supabase.rpc("rotate_organization_access_code", {
    p_org_id: orgId,
  })

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
