import { cn } from "@/lib/utils"

/**
 * A pill toggle: plain glass, gold-tinted while `selected` (aria-pressed).
 * Chips sit in rows, so they never blur; their container does.
 */
export function GlassChip({ selected, className, type = "button", ...props }: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected === undefined ? undefined : selected}
      className={cn("gl-chip gl-focus h-8 px-3.5 text-xs", className)}
      {...props}
    />
  )
}
