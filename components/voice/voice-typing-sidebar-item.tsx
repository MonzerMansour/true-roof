"use client"

import { IconMicrophone } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { setVoiceTyping, useVoiceTyping } from "@/lib/a11y/use-voice-typing"

/** Shows in the sidebar only after voice typing is turned on in Settings,
 * as a quick way to turn it back off. Hidden otherwise, so the sidebar stays
 * about where to go, not settings. */
export function VoiceTypingSidebarGroup() {
  const on = useVoiceTyping()
  if (!on) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Accessibility</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              aria-pressed
              tooltip="Voice typing is on. Tap to turn it off"
              onClick={() => {
                setVoiceTyping(false)
                toast.success("Voice typing off. Turn it back on in Settings.")
              }}
            >
              <IconMicrophone />
              <span>Voice typing: On</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
