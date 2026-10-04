import Link from "next/link"
import { env } from "@/core/config/env"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-heading text-3xl tracking-tight">{env.siteName}</span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Verified warehouse space across India, searchable by the facilities you need.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm sm:items-end">
          <div className="flex gap-6 text-muted-foreground">
            <Link href="/search" className="hover:text-foreground">
              Browse warehouses
            </Link>
            <Link href="/enquire" className="hover:text-foreground">
              Tell us what you need
            </Link>
          </div>
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {env.siteName}
          </span>
        </div>
      </div>
    </footer>
  )
}
