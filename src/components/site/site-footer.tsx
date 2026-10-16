import Link from "next/link"
import { BRAND, CONTACT } from "@/core/config/brand"
import { Wordmark } from "./wordmark"

const NAV = [
  { href: "/search", label: "Warehouses" },
  { href: "/explore", label: "Explore" },
  { href: "/nexus", label: "Nexus Engine" },
  { href: "/enquire", label: "Contact" },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-site-footer text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/" className="w-fit rounded-md" aria-label={`${BRAND} home`}>
              <Wordmark />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Verified warehouse space across India, matched to your requirement by the Nexus engine and run day to day on our
              warehouse management system.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h2 className="mb-1 font-heading text-xs font-semibold tracking-widest uppercase">Navigate</h2>
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="w-fit text-sm text-muted-foreground transition-colors hover:text-site-cyan">
                {l.label}
              </Link>
            ))}
          </nav>
          <address className="flex flex-col gap-3 text-sm text-muted-foreground not-italic">
            <h2 className="mb-1 font-heading text-xs font-semibold tracking-widest text-white uppercase">Connect</h2>
            <a href={`mailto:${CONTACT.email}`} className="w-fit transition-colors hover:text-site-cyan">
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="w-fit transition-colors hover:text-site-cyan">
              {CONTACT.phone}
            </a>
            <span>{CONTACT.address}</span>
          </address>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
