export type MemberRole = "director" | "manager" | "staff"
export type MemberStatus = "pending" | "active" | "rejected"

export type OrganizationMember = {
  id: string
  organizationId: string
  userId: string
  role: MemberRole
  status: MemberStatus
  createdAt: string
}

export type PortalListing = {
  id: string
  organizationId: string
  name: string
  kind: "shelter" | "parking"
  freshness: "live" | "recent" | "call_first"
  lastConfirmedAt: string
  pets: string | null
  couples: string | null
  parkingStatus: string | null
  vehicleNote: string | null
  city: string
  published: boolean
}

export type PortalOrganization = {
  id: string
  name: string
  description: string | null
}

export type PortalContext = {
  userId: string
  email: string | null
  memberships: OrganizationMember[]
  primaryMembership: OrganizationMember | null
  organization: PortalOrganization | null
  listings: PortalListing[]
  isDirector: boolean
  canManage: boolean
  pendingForDirector: PendingMemberRequest[]
}

export type PendingMemberRequest = {
  id: string
  userId: string
  role: MemberRole
  createdAt: string
  email: string | null
}
