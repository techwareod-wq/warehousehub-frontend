import Link from "next/link"
import { env } from "@/core/config/env"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {env.siteName}
        </span>
        <div className="flex gap-4">
          <Link href="/search" className="hover:text-foreground">
            Browse warehouses
          </Link>
          <Link href="/enquire" className="hover:text-foreground">
            Tell us what you need
          </Link>
        </div>
      </div>
    </footer>
  )
}
