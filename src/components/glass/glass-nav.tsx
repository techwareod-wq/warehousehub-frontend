import Link from "next/link"
import { cn } from "@/lib/utils"

/** The floating glass bar. `raised` (e.g. after scrolling) makes it stronger. */
export function GlassNav({ raised, className, ...props }: React.ComponentProps<"div"> & { raised?: boolean }) {
  return <div data-raised={raised || undefined} className={cn("gl-surface gl-subtle gl-nav", className)} {...props} />
}

/** A nav link: quiet text, a blue-tinted glass pill when it's the current page. */
export function GlassNavLink({ active, className, ...props }: React.ComponentProps<typeof Link> & { active?: boolean }) {
  return <Link aria-current={active ? "page" : undefined} className={cn("gl-nav-link gl-focus", className)} {...props} />
}
