import type { Listing } from "@/lib/listings/types"
import { formatPhone } from "@/lib/listings/types"

export function contactForListing(listing: Pick<Listing, "id" | "phone">) {
  if (!listing.phone) return null
  return {
    tel: listing.phone,
    label: formatPhone(listing.phone),
  }
}
