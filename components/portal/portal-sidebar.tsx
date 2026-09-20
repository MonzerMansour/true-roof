"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconBuildingCommunity,
  IconHome,
  IconKey,
  IconSettings,
  IconUser,
} from "@tabler/icons-react"

import { Logo } from "@/components/marketing/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  primaryListingId: string | null
  showAccess: boolean
}

export function PortalSidebar({
  primaryListingId,
  showAccess,
}: PortalSidebarProps) {
  const pathname = usePathname()

  const settingsHref = primaryListingId
    ? `/portal/sites/${primaryListingId}/settings`
    : "/portal/create"

  const items = [
    {
      href: "/portal",
      label: "Home",
      icon: IconHome,
      active: pathname === "/portal",
    },
    {
      href: settingsHref,
      label: "Site settings",
      icon: IconSettings,
      active: pathname.startsWith("/portal/sites/"),
    },
    ...(showAccess
      ? [
          {
            href: "/portal/access",
            label: "Access",
            icon: IconKey,
            active: pathname === "/portal/access",
          },
        ]
      : []),
    {
      href: "/portal/profile",
      label: "Profile",
      icon: IconUser,
      active: pathname === "/portal/profile",
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
        <SidebarGroup>
          <SidebarGroupLabel>Marketing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="For shelters and lots"
                  render={<Link href="/for-providers" />}
                >
                  <IconBuildingCommunity />
                  <span>Public provider page</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2 text-xs text-muted-foreground">
        One row per physical site. Enums only on the listing seekers see.
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
