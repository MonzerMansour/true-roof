"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { IconLogout, IconMenu2, IconSettings, IconUser } from "@tabler/icons-react"

import { useSession } from "@/components/auth/session-provider"
import { SignInDialog } from "@/components/auth/sign-in-dialog"
import { useSignIn } from "@/components/auth/sign-in-provider"
import { Container } from "@/components/marketing/container"
import { Logo } from "@/components/marketing/logo"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  featureNav,
  primaryNav,
  providerAppNav,
  seekerAppNav,
  site,
  type NavItem,
} from "@/lib/site"

export function SiteHeader() {
  const pathname = usePathname()
  const { openSignIn } = useSignIn()
  const { session, signOut } = useSession()

  const nav: NavItem[] = session
    ? session.role === "provider"
      ? providerAppNav
      : seekerAppNav
    : primaryNav
  const homeHref = session
    ? session.role === "provider"
      ? "/portal"
      : "/home"
    : "/"
  const showMarketingFeatures = !session

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-md backdrop-saturate-150">
      <Container className="flex h-14 items-center gap-3 pl-3 sm:pl-4">
        <Link
          href={homeHref}
          aria-label={`${site.name} home`}
          className="-ml-0.5 flex h-14 shrink-0 items-center"
        >
          <Logo showWordmark={false} markClassName="h-5" />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary">
          {nav.map((item) => {
            const active =
              item.href === "/" || item.href === "/home" || item.href === "/portal"
                ? pathname === item.href
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

          {showMarketingFeatures ? (
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
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {session ? (
            <AccountMenu
              email={session.email}
              showSettings={session.role === "seeker"}
              onSignOut={() => void signOut()}
            />
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => openSignIn()}
              >
                Sign in
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => openSignIn()}>
                Get started
              </Button>
            </>
          )}

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
                {nav.map((item) => (
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
                {showMarketingFeatures ? (
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
                ) : null}
              </div>
              <div className="mt-auto flex flex-col gap-2 p-4">
                {session ? (
                  <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                    <IconLogout />
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button
                      className={cn(buttonVariants(), "w-full")}
                      onClick={() => openSignIn()}
                    >
                      Get started
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => openSignIn()}>
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
      {session ? null : <SignInDialog />}
    </header>
  )
}

function AccountMenu({
  email,
  showSettings,
  onSignOut,
}: {
  email: string | null
  showSettings: boolean
  onSignOut: () => void
}) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Account"
          />
        }
      >
        <IconUser />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{email ?? "Signed in"}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {showSettings ? (
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <IconSettings />
            Settings
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <IconLogout />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
