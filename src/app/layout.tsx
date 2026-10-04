import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Newsreader } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { env } from "@/core/config/env"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-display", axes: ["opsz"] })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: `${env.siteName} — find warehouse space`, template: `%s · ${env.siteName}` },
  description: "Search verified warehouses by location, size, price and the facilities your business needs.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={cn("h-full antialiased font-sans", inter.variable, newsreader.variable, geistMono.variable)}>
        <body className="flex min-h-full flex-col bg-background text-foreground">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
