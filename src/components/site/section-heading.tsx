import { cn } from "@/lib/utils"

/** Small uppercase pill above a centred section title (with a leading icon or dot). */
export function SectionBadge({ children, icon, className }: { children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-site-blue/30 bg-site-blue/10 px-3.5 py-1 text-[10px] font-bold tracking-[0.2em] text-site-blue uppercase",
        className,
      )}
    >
      {icon ?? <span aria-hidden className="size-1.5 rounded-full bg-site-blue" />}
      {children}
    </span>
  )
}

/** Wide-tracked uppercase eyebrow over a left-aligned band heading. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-heading text-xs font-semibold tracking-[0.4em] text-white/70 uppercase sm:text-sm", className)}>{children}</p>
}

/** Centred section intro: badge, big uppercase title (accent part in gradient), lede. */
export function SectionIntro({
  badge,
  badgeIcon,
  title,
  accent,
  lede,
  className,
}: {
  badge?: string
  badgeIcon?: React.ReactNode
  title: string
  accent?: string
  lede?: string
  className?: string
}) {
  return (
    <div className={cn("mx-auto flex max-w-3xl flex-col items-center text-center", className)}>
      {badge && (
        <SectionBadge icon={badgeIcon} className="mb-4">
          {badge}
        </SectionBadge>
      )}
      <h2 className="font-heading text-3xl font-black tracking-tight text-balance text-white uppercase sm:text-5xl">
        {title}
        {accent && (
          <>
            {" "}
            <span className="bg-gradient-to-r from-site-blue to-site-cyan bg-clip-text text-transparent">{accent}</span>
          </>
        )}
      </h2>
      {lede && <p className="mt-4 text-base leading-relaxed text-pretty text-slate-300/80 sm:text-lg">{lede}</p>}
    </div>
  )
}
