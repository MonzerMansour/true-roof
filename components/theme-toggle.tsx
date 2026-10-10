"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const themeOptions = [
  { value: "system", label: "Auto", hint: "Follows your phone", icon: IconDeviceDesktop },
  { value: "light", label: "Light", hint: "Always light", icon: IconSun },
  { value: "dark", label: "Dark", hint: "Always dark", icon: IconMoon },
] as const

/** Auto, Light, or Dark. Auto follows the phone's own setting and is the
 * default; it is always one tap away, so picking Light or Dark once never
 * strands someone off automatic. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const current =
    themeOptions.find((option) => option.value === (mounted ? theme : "system")) ??
    themeOptions[0]
  const Icon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-full border-border/70 bg-transparent shadow-none"
            aria-label={`Color theme: ${current.label}. Change it`}
          />
        }
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Color theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={current.value}
            onValueChange={(value) => setTheme(String(value))}
          >
            {themeOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <option.icon />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
