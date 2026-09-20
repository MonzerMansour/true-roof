"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useSignIn } from "@/components/auth/sign-in-provider"

export function MarketingSignInHandler() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { openSignIn } = useSignIn()

  React.useEffect(() => {
    if (searchParams.get("signin") === "1") {
      openSignIn()
      const next = new URLSearchParams(searchParams.toString())
      next.delete("signin")
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    if (searchParams.get("portal") === "providers-only") {
      toast.message("The staff portal is for provider accounts.", {
        description: "Sign in from the page for shelters and parking lots.",
      })
      const next = new URLSearchParams(searchParams.toString())
      next.delete("portal")
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }
  }, [searchParams, pathname, router, openSignIn])

  return null
}
