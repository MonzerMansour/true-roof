"use client"

import type { ComponentProps, ReactNode } from "react"

import { useSignIn } from "@/components/auth/sign-in-provider"
import { Button } from "@/components/ui/button"

export function SignInButton({
  children = "Get started",
  variant = "default",
  size = "lg",
  className,
}: {
  children?: ReactNode
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
}) {
  const { openSignIn } = useSignIn()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={openSignIn}
    >
      {children}
    </Button>
  )
}
