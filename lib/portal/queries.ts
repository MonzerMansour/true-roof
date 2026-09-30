import { redirect } from "next/navigation"

import { portalListingSelectTiers } from "@/lib/listings/columns"
import type { DataSource } from "@/lib/listings/sources"
import { normalizeTime } from "@/lib/listings/types"
import type {
  CouplesPolicy,
  CurfewPolicy,
  Freshness,
  IdRequired,
  IntakeMethod,
  MaxStay,
  ParkingStatus,
  PetsPolicy,
  ProjectType,
  RegistrationRequired,
  SiteKind,
  VehicleAllowed,
} from "@/lib/listings/types"
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
  kind: SiteKind
  freshness: Freshness
  last_confirmed_at: string
  pets: PetsPolicy | null
  couples: CouplesPolicy | null
  parking_status: ParkingStatus | null
  vehicle_note: string | null
  city: string
  published: boolean
  // Optional because the narrower select tiers omit them.
  lat?: number | null
  lng?: number | null
  phone?: string | null
  intake_method?: IntakeMethod | null
  address?: string | null
  id_required?: IdRequired | null
  curfew_policy?: CurfewPolicy | null
  curfew_time?: string | null
  intake_from?: string | null
  intake_to?: string | null
  max_stay?: MaxStay | null
  pet_weight_limit_lbs?: number | null
  vehicle_allowed?: VehicleAllowed | null
  vehicle_max_length_ft?: number | null
  registration_required?: RegistrationRequired | null
  project_type?: ProjectType | null
  total_beds?: number | null
  data_source?: DataSource | null
  source_url?: string | null
  source_as_of?: string | null
}

/** Try the widest select first and fall back, so a project that has not run
 * every migration still loads the portal. Same tiering as
 * lib/listings/queries.ts, driven by the same column registry. */
async function selectPortalListings(
  build: (select: string) => PromiseLike<{
    error: { message: string } | null
    data: unknown
  }>
) {
  for (const select of portalListingSelectTiers) {
    const result = await build(select)
    if (!result.error && result.data) return result.data
  }
  return null
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
    address: row.address ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    phone: row.phone ?? null,
    // Stays null on purpose. Staff need to see that nobody has chosen yet.
    intakeMethod: row.intake_method ?? null,
    idRequired: row.id_required ?? null,
    curfewPolicy: row.curfew_policy ?? null,
    curfewTime: normalizeTime(row.curfew_time ?? null),
    intakeFrom: normalizeTime(row.intake_from ?? null),
    intakeTo: normalizeTime(row.intake_to ?? null),
    maxStay: row.max_stay ?? null,
    petWeightLimitLbs: row.pet_weight_limit_lbs ?? null,
    vehicleAllowed: row.vehicle_allowed ?? null,
    vehicleMaxLengthFt: row.vehicle_max_length_ft ?? null,
    registrationRequired: row.registration_required ?? null,
    projectType: row.project_type ?? null,
    totalBeds: row.total_beds ?? null,
    dataSource: row.data_source ?? null,
    sourceUrl: row.source_url ?? null,
    sourceAsOf: row.source_as_of ?? null,
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
    redirect("/home?portal=providers-only")
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

    const listingRows = await selectPortalListings((select) =>
      supabase
        .from("listings")
        .select(select)
        .eq("organization_id", primaryMembership.organizationId)
        .order("created_at", { ascending: true })
    )

    listings = ((listingRows as ListingRow[] | null) ?? []).map(mapListing)

    const isDirector =
      active?.role === "director" &&
      active.organizationId === primaryMembership.organizationId

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

  const selected = await selectPortalListings((select) =>
    supabase.from("listings").select(select).eq("id", listingId).maybeSingle()
  )

  const listingRow = selected as ListingRow | null

  if (!listingRow) {
    redirect("/portal")
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("status, role")
    .eq("organization_id", listingRow.organization_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    redirect("/portal")
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, description")
    .eq("id", listingRow.organization_id)
    .maybeSingle()

  return {
    listing: mapListing(listingRow as ListingRow),
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
