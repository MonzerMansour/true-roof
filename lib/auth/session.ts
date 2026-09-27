import { createServerSupabaseClient } from "@/lib/supabase/server"

export type AppRole = "seeker" | "provider"

export type AppSession = {
  id: string
  email: string | null
  role: AppRole
}

export function homePathForRole(role: AppRole) {
  return role === "provider" ? "/portal" : "/home"
}

function roleFrom(value: string | null | undefined): AppRole {
  return value === "provider" ? "provider" : "seeker"
}

export async function getAppSession(): Promise<AppSession | null> {
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

  return {
    id: user.id,
    email: user.email ?? null,
    role: roleFrom(profile?.role ?? user.user_metadata?.role),
  }
}
