import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Newsreader, Outfit, Plus_Jakarta_Sans } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { BRAND } from "@/core/config/brand"
import { env } from "@/core/config/env"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-display", axes: ["opsz"] })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
// Public site faces (applied under .site in globals.css): Outfit for display, Plus Jakarta Sans for text.
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: `${BRAND} — find warehouse space`, template: `%s · ${BRAND}` },
  description: "Search verified warehouses by location, size, price and the facilities your business needs.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={cn("h-full antialiased font-sans", inter.variable, newsreader.variable, geistMono.variable, outfit.variable, jakarta.variable)}>
        <body className="flex min-h-full flex-col bg-background text-foreground">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
