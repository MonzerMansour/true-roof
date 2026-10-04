// Server only. Never import this from a client component.
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Service role client. Bypasses RLS, so it is only for writes no signed-in
// person is allowed to make themselves: listing embeddings and the embed
// rate-limit log. Never import this from a client component. Returns null
// when the key is not set, so callers can skip the work instead of crashing.
export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
