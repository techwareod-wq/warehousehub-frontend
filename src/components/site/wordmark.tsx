import { BRAND } from "@/core/config/brand"
import { cn } from "@/lib/utils"

/**
 * Text wordmark until a logo file is supplied: a small node mark (three
 * linked hubs) beside the brand name in the display face.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
        <rect width="32" height="32" rx="9" className="fill-site-blue/15 stroke-site-blue/50" strokeWidth="1" />
        <path d="M10 21 16 10l6 11z" fill="none" className="stroke-site-cyan" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="16" cy="10" r="2.6" className="fill-site-blue" />
        <circle cx="10" cy="21" r="2.6" className="fill-site-cyan" />
        <circle cx="22" cy="21" r="2.6" className="fill-site-green" />
      </svg>
      <span className="font-heading text-xl font-bold tracking-[0.12em] text-white uppercase">{BRAND}</span>
    </span>
  )
}
