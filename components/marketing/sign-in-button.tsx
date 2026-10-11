"use client"

import type { ComponentProps, ReactNode } from "react"

import { useSignIn } from "@/components/auth/sign-in-provider"
import { Button } from "@/components/ui/button"

export function SignInButton({
  children = "Get started",
  variant = "default",
  size = "lg",
  className,
  next,
}: {
  children?: ReactNode
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
  /** Where to land once they are in. Lets a gated page prompt from the page
   * the person was browsing and still take them on afterwards. */
  next?: string
}) {
  const { openSignIn } = useSignIn()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => openSignIn({ next })}
    >
      {children}
    </Button>
  )
}
