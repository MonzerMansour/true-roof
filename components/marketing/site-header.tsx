"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconMenu2 } from "@tabler/icons-react"

import { SignInDialog } from "@/components/auth/sign-in-dialog"
import { useSignIn } from "@/components/auth/sign-in-provider"
import { Container } from "@/components/marketing/container"
import { Logo } from "@/components/marketing/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "cn"
import { featureNav, primaryNav, site } from "@/lib/site"

export function SiteHeader() {
  const pathname = usePathname()
  const { openSignIn } = useSignIn()

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/5 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <Container className="flex h-14 items-center gap-3 pl-3 sm:pl-4">
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="-ml-0.5 flex h-14 shrink-0 items-center"
        >
          <Logo showWordmark={false} markClassName="h-5" />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary">
          {primaryNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}

          <NavigationMenu align="start">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-muted-foreground">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[min(36rem,calc(100vw-2rem))] p-2">
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {featureNav.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink
                          render={<Link href={item.href} />}
                          className="flex-col items-start gap-0.5"
                        >
                          <span className="font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </span>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={openSignIn}
          >
            Sign in
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" onClick={openSignIn}>
            Get started
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <IconMenu2 />
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <SheetHeader>
                <SheetTitle>
                  <Logo showWordmark={false} markClassName="h-5" />
                </SheetTitle>
                <SheetDescription>{site.tagline}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4">
                {primaryNav.map((item) => (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className="rounded-lg px-2 py-2 text-sm font-medium hover:bg-muted"
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                ))}
                <Accordion>
                  <AccordionItem value="features">
                    <AccordionTrigger>Features</AccordionTrigger>
                    <AccordionContent>
                      <ul className="grid gap-1">
                        {featureNav.map((item) => (
                          <li key={item.href}>
                            <SheetClose
                              nativeButton={false}
                              render={
                                <Link
                                  href={item.href}
                                  className="block rounded-lg py-1.5 text-sm hover:underline"
                                />
                              }
                            >
                              {item.label}
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Button
                  className={cn(buttonVariants(), "w-full")}
                  onClick={openSignIn}
                >
                  Get started
                </Button>
                <Button variant="outline" className="w-full" onClick={openSignIn}>
                  Sign in
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
      <SignInDialog />
    </header>
  )
}
