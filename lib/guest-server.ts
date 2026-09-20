import { cookies } from "next/headers"

import { GUEST_COOKIE } from "@/lib/guest"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function isGuest() {
  return (await cookies()).get(GUEST_COOKIE)?.value === "1"
}

// True for a signed-in account or a guest. Use this to gate seeker pages.
export async function hasSeekerAccess() {
  const client = await createServerSupabaseClient()
  const user = client ? (await client.auth.getUser()).data.user : null

  return Boolean(user) || (await isGuest())
}
