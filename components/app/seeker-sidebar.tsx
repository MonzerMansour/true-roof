"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconHome,
  IconMapPin,
  IconWallet,
} from "@tabler/icons-react"

import { Logo } from "@/components/marketing/logo"
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
import { seekerAppNav, site } from "@/lib/site"

const icons = {
  "/home": IconHome,
  "/places": IconMapPin,
  "/financials": IconWallet,
} as const

export function SeekerSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/home" />}>
              <Logo showWordmark={false} markClassName="size-5" />
              <span className="font-heading font-semibold">{site.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>For you</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {seekerAppNav.map((item) => {
                const Icon = icons[item.href as keyof typeof icons] ?? IconHome
                const active =
                  item.href === "/home"
                    ? pathname === "/home"
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
