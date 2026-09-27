import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function isMarketingPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/for-providers" ||
    pathname.startsWith("/features")
  )
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

  if (user && isMarketingPath(pathname)) {
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
