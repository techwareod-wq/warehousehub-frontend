"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Wordmark } from "./wordmark"

/**
 * The site bar. On the home page it floats transparent over the hero and
 * turns solid once the visitor scrolls; everywhere else it is a solid sticky
 * h-16 bar (the explore map sizes itself to 100dvh − 4rem).
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
    { href: "/nexus", label: "Nexus Engine", show: true },
    { href: "/enquire", label: "Contact", show: canEnquire },
    { href: "/account", label: "Account", show: signedIn },
  ].filter((t) => t.show)

  const solid = !home || scrolled || open
  const roomy = home && !scrolled

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        home ? "fixed" : "sticky",
        solid ? "border-white/10 bg-site-nav/85 shadow-lg backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 transition-[height] duration-300 sm:px-8 lg:px-12",
          roomy ? "h-20 lg:h-24" : "h-16",
        )}
      >
        <Link href="/" className="rounded-md py-1 transition-opacity hover:opacity-90" aria-label="Nexus home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex lg:gap-9">
          {tabs.map((t) => {
            const on = pathname.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors lg:text-xs",
                  on ? "text-site-cyan" : "text-white/80 hover:text-white",
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition-colors hover:bg-white/10 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="site-mobile-menu"
          aria-label="Main"
          className="mx-4 mb-4 flex flex-col gap-1 rounded-2xl border border-white/10 bg-site-ink/95 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200 md:hidden"
        >
          {tabs.map((t) => {
            const on = pathname.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={on ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase transition-colors",
                  on ? "text-site-cyan" : "text-white/80 hover:bg-white/5 hover:text-white",
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
