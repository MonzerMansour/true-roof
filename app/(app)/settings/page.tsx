import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SettingsClient } from "@/components/app/settings-client"
import { Container } from "@/components/marketing/container"
import { getAppSession, homePathForRole } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Settings",
  description: "Your answers, your plan, and your account.",
}

export default async function SettingsPage() {
  const session = await getAppSession()

  if (session?.role === "provider") {
    redirect(homePathForRole("provider"))
  }

  return (
    <Container className="py-8 sm:py-10">
      <SettingsClient />
    </Container>
  )
}
