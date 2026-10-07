import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Noto_Sans, Nunito_Sans } from "next/font/google"

import { AppProviders } from "@/components/app-providers"
import { cn } from "@/lib/utils"
import { getAppSession } from "@/lib/auth/session"
import { a11yBootScript } from "@/lib/a11y/preferences"
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
    default: `${site.name}: ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
}

// There was no viewport export anywhere in the app. Next injects a sensible
// default, but declaring it makes the zoom policy explicit and adds a themeColor
// that matches the current theme.
//
// maximumScale and userScalable are deliberately permissive. Locking zoom is the
// usual shipped accessibility violation, and it lands hardest on exactly the
// cheap phones and large-text users this product is built for.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // The array form is required: next-themes drives a .dark class, so a single
  // value would be wrong in one theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0a0e" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const session = await getAppSession()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        notoSans.variable,
        nunitoSansHeading.variable
      )}
    >
      <head>
        {/* Applies saved text size and contrast before the first paint.
            Without it the page renders at normal size and jumps when React
            hydrates, which is the person this setting exists for watching the
            text they need resize under them. */}
        <script dangerouslySetInnerHTML={{ __html: a11yBootScript }} />
      </head>
      <body>
        <AppProviders session={session}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
          >
            Skip to content
          </a>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
