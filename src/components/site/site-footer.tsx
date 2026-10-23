import Link from "next/link"
import { GlassPanel } from "@/components/glass"
import { BRAND, CONTACT } from "@/core/config/brand"
import { Wordmark } from "./wordmark"

const NAV = [
  { href: "/search", label: "Warehouses" },
  { href: "/explore", label: "Explore" },
  { href: "/nexus", label: "Nexus Engine" },
  { href: "/enquire", label: "Contact" },
]

const LINK = "gl-focus w-fit rounded-sm transition-colors hover:text-glass-accent-text"

export function SiteFooter() {
  return (
    <footer className="mt-auto px-3 pt-6 pb-3 text-white sm:px-4 sm:pb-4">
      <GlassPanel level="subtle" className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/" className="gl-focus w-fit rounded-md" aria-label={`${BRAND} home`}>
              <Wordmark />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-glass-text-3">
              Verified warehouse space across India, matched to your requirement by the Nexus engine and run day to day on our
              warehouse management system.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h2 className="mb-1 font-heading text-xs font-semibold tracking-widest text-glass-text uppercase">Navigate</h2>
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className={`${LINK} text-sm text-glass-text-3`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <address className="flex flex-col gap-3 text-sm text-glass-text-3 not-italic">
            <h2 className="mb-1 font-heading text-xs font-semibold tracking-widest text-glass-text uppercase">Connect</h2>
            <a href={`mailto:${CONTACT.email}`} className={LINK}>
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className={LINK}>
              {CONTACT.phone}
            </a>
            <span>{CONTACT.address}</span>
          </address>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-glass-text-3">
          © {new Date().getFullYear()} {BRAND}. All rights reserved.
        </p>
      </GlassPanel>
    </footer>
  )
}
