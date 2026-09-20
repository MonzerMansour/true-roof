import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Noto_Sans, Nunito_Sans } from "next/font/google"

import { AppProviders } from "@/components/app-providers"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

import "./globals.css"

const nunitoSansHeading = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
})

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        notoSans.variable,
        nunitoSansHeading.variable
      )}
    >
      <body>
        <AppProviders>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
          >
            Skip to content
          </a>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
