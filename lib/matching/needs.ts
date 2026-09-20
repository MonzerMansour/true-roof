// What a person looking for a place tells True Roof. Every answer is a fixed
// option or a structured time, never free text, so it can be checked against
// a listing's rules.
//
// Hard constraints remove a listing when they are not met: pets, vehicle,
// ID, couples. Time fields (curfew, intake window, max stay) are structured
// so the matcher can compare them to the site's own hours.

export type Household = "alone" | "with_partner"
export type PartnerRooms = "same_room" | "separate_rooms" | "either"
export type PetNeed = "none" | "service_animal" | "small_pet" | "larger_pet"
export type IdStatus = "have_id" | "no_id" | "in_progress"
export type VehicleNeed = "none" | "car" | "rv_van"
export type VehicleSize = "standard" | "large"
export type VehicleRegistered = "yes" | "no" | "not_sure"

export type SeekerNeeds = {
  household: Household
  partnerRooms: PartnerRooms | null
  pet: PetNeed
  petWeightLbs: number | null
  idStatus: IdStatus
  vehicle: VehicleNeed
  vehicleSize: VehicleSize | null
  vehicleRegistered: VehicleRegistered | null
  /** HH:MM, 24 hour. Earliest and latest time you can get there to check in. */
  arrivalFrom: string
  arrivalTo: string
  /** HH:MM, 24 hour. Latest you need to be let in. Null means no late need. */
  latestEntry: string | null
  /** Nights you need a bed. */
  daysNeeded: number
}

export const householdLabel: Record<Household, string> = {
  alone: "Just me",
  with_partner: "Me and my partner",
}

export const partnerRoomsLabel: Record<PartnerRooms, string> = {
  same_room: "Together, in the same room",
  separate_rooms: "Separate rooms are fine",
  either: "Either works",
}

export const petLabel: Record<PetNeed, string> = {
  none: "No pet",
  service_animal: "A service animal",
  small_pet: "A small pet",
  larger_pet: "A larger pet",
}

export const idLabel: Record<IdStatus, string> = {
  have_id: "Yes, I have ID",
  no_id: "No, I do not have ID",
  in_progress: "I am getting one",
}

export const vehicleLabel: Record<VehicleNeed, string> = {
  none: "No vehicle",
  car: "A car",
  rv_van: "An RV or van",
}

export const vehicleSizeLabel: Record<VehicleSize, string> = {
  standard: "Fits a normal parking space",
  large: "Longer than a normal space",
}

export const vehicleRegisteredLabel: Record<VehicleRegistered, string> = {
  yes: "Yes, registered and it runs",
  no: "No",
  not_sure: "Not sure",
}

export const stayOptions: { days: number; label: string }[] = [
  { days: 1, label: "Tonight only" },
  { days: 14, label: "About 2 weeks" },
  { days: 30, label: "About a month" },
  { days: 90, label: "About 3 months" },
  { days: 180, label: "6 months or longer" },
]

export const latestEntryOptions: { value: string | null; label: string }[] = [
  { value: null, label: "No, I can be inside early" },
  { value: "20:00", label: "By 8:00 PM" },
  { value: "21:00", label: "By 9:00 PM" },
  { value: "22:00", label: "By 10:00 PM" },
  { value: "23:00", label: "By 11:00 PM" },
  { value: "00:00", label: "Midnight or later" },
]

export function stayLabel(days: number) {
  return stayOptions.find((option) => option.days === days)?.label ?? `${days} nights`
}

export function latestEntryLabel(value: string | null) {
  return (
    latestEntryOptions.find((option) => option.value === value)?.label ??
    "No, I can be inside early"
  )
}

export function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`
}
