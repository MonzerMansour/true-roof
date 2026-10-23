"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconHome,
  IconSettings,
  IconUser,
} from "@tabler/icons-react"

import { Logo } from "@/components/marketing/logo"
import { VoiceTypingSidebarGroup } from "@/components/voice/voice-typing-sidebar-item"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { site } from "@/lib/site"

type PortalSidebarProps = {
  /** The site this organization has started and not published yet, if any.
   * Only one can be in progress, so there is at most one. */
  draftListingId: string | null
}

export function PortalSidebar({ draftListingId }: PortalSidebarProps) {
  const pathname = usePathname()

  const items = [
    {
      href: "/portal",
      label: "Home",
      icon: IconHome,
      active: pathname === "/portal",
    },
    // Site settings is only here while there is a draft to finish, and it
    // opens that draft directly. Once the site is published, its settings are
    // reached from the site itself (Edit details), so they are not a tab that
    // points at nothing.
    ...(draftListingId
      ? [
          {
            href: `/portal/sites/${draftListingId}/settings`,
            label: "Site settings",
            icon: IconSettings,
            active: pathname.startsWith(`/portal/sites/${draftListingId}`),
          },
        ]
      : []),
    {
      href: "/portal/settings",
      label: "Settings",
      icon: IconUser,
      active: pathname === "/portal/settings",
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/portal" />}>
              <Logo showWordmark={false} markClassName="size-5" />
              <span className="font-heading font-semibold">{site.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Staff portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={item.active}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <VoiceTypingSidebarGroup />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
