import { NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? "/"
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/"

  if (code) {
    const supabase = await createServerSupabaseClient()

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const roleParam = searchParams.get("role")
        const cookieRole = request.headers
          .get("cookie")
          ?.match(/true-roof-pending-role=(seeker|provider)/)?.[1]
        const pendingRole =
          roleParam === "seeker" || roleParam === "provider"
            ? roleParam
            : cookieRole

        if (pendingRole) {
          const {
            data: { user },
          } = await supabase.auth.getUser()

          const createdAt = user?.created_at
            ? new Date(user.created_at).getTime()
            : 0
          const isNewAccount = Date.now() - createdAt < 5 * 60 * 1000

          if (user && isNewAccount) {
            await supabase.auth.updateUser({
              data: { role: pendingRole },
            })
            await supabase.from("profiles").upsert(
              { id: user.id, role: pendingRole },
              { onConflict: "id" }
            )
          }
        }
      }
    }
  }

  const redirect = NextResponse.redirect(new URL(next, origin))
  redirect.cookies.set("true-roof-pending-role", "", { maxAge: 0, path: "/" })
  return redirect
}
