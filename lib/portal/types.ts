import type { DataSource } from "@/lib/listings/sources"
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

/** The staff view of a site.
 *
 * Deliberately separate from Listing, and NOT a superset of it:
 *  - intakeMethod is nullable here. Listing derives a default via
 *    defaultIntakeMethod so the seeker always sees an action, but the portal has
 *    to show staff whether they have actually chosen one yet.
 *  - it carries the ops columns (published, organizationId) the seeker view has
 *    no business knowing about.
 *  - the portal query does not join organizations, so there is no orgName.
 *
 * The enums are imported rather than restated. They used to be widened to
 * `string` here, which meant a typo in the settings form only failed at the
 * database check constraint. */
export type PortalListing = {
  id: string
  organizationId: string
  name: string
  kind: SiteKind
  freshness: Freshness
  lastConfirmedAt: string
  pets: PetsPolicy | null
  couples: CouplesPolicy | null
  parkingStatus: ParkingStatus | null
  vehicleNote: string | null
  city: string
  published: boolean
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  intakeMethod: IntakeMethod | null
  idRequired: IdRequired | null
  curfewPolicy: CurfewPolicy | null
  curfewTime: string | null
  intakeFrom: string | null
  intakeTo: string | null
  maxStay: MaxStay | null
  petWeightLimitLbs: number | null
  vehicleAllowed: VehicleAllowed | null
  vehicleMaxLengthFt: number | null
  registrationRequired: RegistrationRequired | null
  projectType: ProjectType | null
  totalBeds: number | null
  dataSource: DataSource | null
  sourceUrl: string | null
  sourceAsOf: string | null
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
