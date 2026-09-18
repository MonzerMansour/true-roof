"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Color theme" />
        }
      >
        {mounted && theme === "dark" ? (
          <IconMoon />
        ) : mounted && theme === "light" ? (
          <IconSun />
        ) : (
          <IconDeviceDesktop />
        )}
        <span className="sr-only">Color theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup
          value={mounted ? theme : "system"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="system">
            <IconDeviceDesktop />
            System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <IconSun />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <IconMoon />
            Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
