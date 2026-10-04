"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

/** The header tabs; the current one is underlined. */
export function SiteNav({ canSearch, canEnquire, signedIn }: { canSearch: boolean; canEnquire: boolean; signedIn: boolean }) {
  const pathname = usePathname()
  const tabs = [
    { href: "/search", label: "Search", show: canSearch },
    { href: "/#how-it-works", label: "How it works", show: true },
    { href: "/#industries", label: "Industries", show: true },
    { href: "/enquire", label: "Get help finding space", show: canEnquire },
    { href: "/account", label: "Account", show: signedIn },
  ]
  return (
    <nav className="hidden items-center gap-7 text-[15px] md:flex">
      {tabs
        .filter((t) => t.show)
        .map((t) => {
          const on = !t.href.includes("#") && pathname.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "py-1 underline-offset-[10px] transition-colors",
                on ? "text-foreground underline decoration-primary decoration-2" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          )
        })}
    </nav>
  )
}
