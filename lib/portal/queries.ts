import { redirect } from "next/navigation"

import type {
  OrganizationMember,
  PendingMemberRequest,
  PortalContext,
  PortalListing,
  PortalOrganization,
} from "@/lib/portal/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type MemberRow = {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationMember["role"]
  status: OrganizationMember["status"]
  created_at: string
}

type ListingRow = {
  id: string
  organization_id: string
  name: string
  kind: PortalListing["kind"]
  freshness: PortalListing["freshness"]
  last_confirmed_at: string
  pets: string | null
  couples: string | null
  parking_status: string | null
  vehicle_note: string | null
  city: string
  published: boolean
}

function mapMember(row: MemberRow): OrganizationMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapListing(row: ListingRow): PortalListing {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    kind: row.kind,
    freshness: row.freshness,
    lastConfirmedAt: row.last_confirmed_at,
    pets: row.pets,
    couples: row.couples,
    parkingStatus: row.parking_status,
    vehicleNote: row.vehicle_note,
    city: row.city,
    published: row.published,
  }
}

export async function requireProviderSession() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    redirect("/for-providers?signin=1")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/for-providers?signin=1")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "provider") {
    redirect("/?portal=providers-only")
  }

  return { supabase, user }
}

export async function getPortalContext(): Promise<PortalContext | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "provider") return null

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("id, organization_id, user_id, role, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  const memberships = (memberRows ?? []).map((row) =>
    mapMember(row as MemberRow)
  )

  const active = memberships.find((m) => m.status === "active")
  const pending = memberships.find((m) => m.status === "pending")
  const primaryMembership = active ?? pending ?? memberships[0] ?? null

  let organization: PortalOrganization | null = null
  let listings: PortalListing[] = []
  let pendingForDirector: PendingMemberRequest[] = []

  if (primaryMembership) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, description")
      .eq("id", primaryMembership.organizationId)
      .maybeSingle()

    if (orgRow) {
      organization = {
        id: orgRow.id,
        name: orgRow.name,
        description: orgRow.description,
      }
    }

    const { data: listingRows } = await supabase
      .from("listings")
      .select(
        "id, organization_id, name, kind, freshness, last_confirmed_at, pets, couples, parking_status, vehicle_note, city, published"
      )
      .eq("organization_id", primaryMembership.organizationId)
      .order("created_at", { ascending: true })

    listings = (listingRows ?? []).map((row) => mapListing(row as ListingRow))

    const isDirector =
      active?.role === "director" && active.organizationId === primaryMembership.organizationId

    if (isDirector && active) {
      const { data: pendingRows } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", active.organizationId)
        .eq("status", "pending")
        .order("created_at", { ascending: true })

      pendingForDirector = (pendingRows ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role as PendingMemberRequest["role"],
        createdAt: row.created_at,
        email: null,
      }))
    }
  }

  const isDirector = active?.role === "director"
  const canManage = active?.role === "director" || active?.role === "manager"

  return {
    userId: user.id,
    email: user.email ?? null,
    memberships,
    primaryMembership,
    organization,
    listings,
    isDirector: Boolean(isDirector),
    canManage: Boolean(canManage),
    pendingForDirector,
  }
}

export async function getListingForPortal(listingId: string) {
  const { supabase, user } = await requireProviderSession()

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "id, organization_id, name, kind, freshness, last_confirmed_at, pets, couples, parking_status, vehicle_note, city, published"
    )
    .eq("id", listingId)
    .maybeSingle()

  if (error || !listing) {
    redirect("/portal")
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("status, role")
    .eq("organization_id", listing.organization_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    redirect("/portal")
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, description")
    .eq("id", listing.organization_id)
    .maybeSingle()

  return {
    listing: mapListing(listing as ListingRow),
    organization: orgRow
      ? {
          id: orgRow.id,
          name: orgRow.name,
          description: orgRow.description,
        }
      : null,
    canManage: membership.role === "director" || membership.role === "manager",
    role: membership.role as OrganizationMember["role"],
  }
}
