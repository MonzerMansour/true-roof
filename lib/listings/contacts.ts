import { here4You } from "@/lib/listings/sources"
import type { DataSource } from "@/lib/listings/sources"
import type { Listing } from "@/lib/listings/types"
import { formatPhone } from "@/lib/listings/types"

export type ListingContact = {
  tel: string
  label: string
  /** True when this is the county referral line rather than the site's own
   * number, so the UI can say whose number it is. */
  isReferralLine: boolean
  note: string | null
}

/** How to reach this site.
 *
 * Falls back to the county Here4You line for an imported row with no phone.
 * Without that fallback, a row whose intake method is "call" and whose phone is
 * null renders a call action with nothing to call, which is most of the HUD
 * sourced database. Here4You is not a workaround: it is the county's own
 * centralized intake line for exactly these programs, so it is the correct
 * number for someone to ring.
 */
export function contactForListing(
  listing: Pick<Listing, "id" | "phone"> & { dataSource?: DataSource | null }
): ListingContact | null {
  if (listing.phone) {
    return {
      tel: listing.phone,
      label: formatPhone(listing.phone),
      isReferralLine: false,
      note: null,
    }
  }

  const imported =
    listing.dataSource === "hud_hic_2025" || listing.dataSource === "county_osh"

  if (imported) {
    return {
      tel: here4You.phone,
      label: here4You.display,
      isReferralLine: true,
      note: `${here4You.name}, the county shelter line. This site has no public number.`,
    }
  }

  return null
}
