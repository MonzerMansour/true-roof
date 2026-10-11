import { cookies } from "next/headers"

import { GUEST_COOKIE } from "@/lib/guest"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function isGuest() {
  return (await cookies()).get(GUEST_COOKIE)?.value === "1"
}

// True for a signed-in account or a guest.
//
// Nothing calls this any more. Its last caller was /financials/income, which
// was removed, and no seeker page is gated on the guest cookie today: a
// signed-out person gets the whole of Places, Financials, the plan and
// Settings. The questionnaire is the one gated page and it needs a real
// auth.uid() rather than this, because the answers are written to a
// seeker_needs row under RLS.
//
// Left here because "Continue as a guest" still writes the cookie. Do not
// read this as evidence that something is protected.
export async function hasSeekerAccess() {
  const client = await createServerSupabaseClient()
  const user = client ? (await client.auth.getUser()).data.user : null

  return Boolean(user) || (await isGuest())
}
