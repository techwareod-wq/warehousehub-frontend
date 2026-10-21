"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { GlassNav, GlassNavLink, glassButton, glassSurface } from "@/components/glass"
import { cn } from "@/lib/utils"
import { Wordmark } from "./wordmark"

/**
 * The site bar: a floating glass bar inset from the screen edge. On the home
 * page it floats over the hero (fixed, roomier until the visitor scrolls);
 * everywhere else it is sticky and the header stays exactly h-16 (the
 * explore map sizes itself to 100dvh − 4rem). Scrolling raises the glass.
 */
export function SiteNav({
  canSearch,
  canEnquire,
  signedIn,
  actions,
}: {
  canSearch: boolean
  canEnquire: boolean
  signedIn: boolean
  actions: React.ReactNode
}) {
  const pathname = usePathname()
  const home = pathname === "/"
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const tabs = [
    { href: "/search", label: "Warehouses", show: canSearch },
    { href: "/explore", label: "Explore", show: canSearch },
    { href: "/find", label: "Finder", show: canSearch && process.env.NEXT_PUBLIC_ENABLE_FINDER === "true" }, // FINDER (remove to uninstall)
    { href: "/nexus", label: "Nexus Engine", show: true },
    { href: "/enquire", label: "Contact", show: canEnquire },
    { href: "/account", label: "Account", show: signedIn },
  ].filter((t) => t.show)

  const roomy = home && !scrolled

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-40 flex items-center px-3 transition-[height] duration-300 sm:px-4",
        home ? "fixed" : "sticky",
        roomy ? "h-20 lg:h-24" : "h-16",
      )}
    >
      {/* The bar and the mobile sheet are siblings: a blur nested in a blur only sees its parent. */}
      <div className="relative mx-auto w-full max-w-7xl">
        <GlassNav
          raised={scrolled || open}
          className="flex h-12 w-full items-center justify-between gap-4 rounded-full pr-2 pl-4 sm:pl-5"
        >
          <Link href="/" className="gl-focus rounded-full py-1 transition-opacity hover:opacity-90" aria-label="Nexus home">
            <Wordmark />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {tabs.map((t) => (
              <GlassNavLink
                key={t.href}
                href={t.href}
                active={pathname.startsWith(t.href)}
                className="px-3.5 py-1.5 text-xs font-semibold tracking-[0.16em] whitespace-nowrap uppercase"
              >
                {t.label}
              </GlassNavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={glassButton({ variant: "ghost", size: "icon", className: "size-9 lg:hidden" })}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </GlassNav>

        {open && (
          <nav
            id="site-mobile-menu"
            aria-label="Main"
            className={cn(
              glassSurface({ level: "strong" }),
              "gl-panel absolute inset-x-0 top-full mt-2 flex flex-col gap-1 p-3 animate-in fade-in slide-in-from-top-1 duration-200 lg:hidden",
            )}
          >
            {tabs.map((t) => (
              <GlassNavLink
                key={t.href}
                href={t.href}
                active={pathname.startsWith(t.href)}
                onClick={() => setOpen(false)}
                className="rounded-[14px] px-3 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase"
              >
                {t.label}
              </GlassNavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
