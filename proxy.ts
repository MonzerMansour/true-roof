import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Only the landing page bounces a signed-in person into the app.
//
// The rest of the marketing site stays browsable while signed in. Someone who
// wants to read what a feature does, or a seeker who wants to see the provider
// page, should not be thrown back to their dashboard with no way through. There
// was no escape hatch: typing the URL redirected too.
function isLandingPath(pathname: string) {
  return pathname === "/"
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  let role: "seeker" | "provider" | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    role =
      profile?.role === "provider" || user.user_metadata?.role === "provider"
        ? "provider"
        : "seeker"
  }

  if (user && isLandingPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = role === "provider" ? "/portal" : "/home"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname.startsWith("/portal")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/for-providers"
      redirectUrl.searchParams.set("signin", "1")
      return NextResponse.redirect(redirectUrl)
    }

    if (role !== "provider") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/home"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
