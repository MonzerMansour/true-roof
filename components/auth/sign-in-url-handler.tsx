"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useSignIn } from "@/components/auth/sign-in-provider"

/**
 * Opens the sign-in dialog when a page was reached with `?signin=1`, and
 * carries `next` through so the person lands back where they were headed.
 *
 * A server component cannot open a dialog, so a gate that needs one redirects
 * here with those two parameters rather than to a sign-in page of its own.
 * The parameters are stripped afterwards, so a refresh or a shared link does
 * not re-open the dialog over a page the person is already reading.
 */
export function SignInUrlHandler() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { openSignIn } = useSignIn()

  React.useEffect(() => {
    if (searchParams.get("signin") !== "1") return

    openSignIn({ next: searchParams.get("next") ?? undefined })

    const rest = new URLSearchParams(searchParams.toString())
    rest.delete("signin")
    rest.delete("next")
    const query = rest.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [searchParams, pathname, router, openSignIn])

  return null
}
