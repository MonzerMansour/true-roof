"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignInButton } from "@/components/marketing/sign-in-button"

export function NeedsSignIn({
  title = "Sign in to start your plan",
  description = "Tracking rent, bills, and recerts is tied to your account so it is there next time you open True Roof.",
}: {
  title?: string
  description?: string
}) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInButton>Sign in</SignInButton>
      </CardContent>
    </Card>
  )
}
