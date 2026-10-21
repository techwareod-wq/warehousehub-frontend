import { cn } from "@/lib/utils"

export type GlassLevel = "subtle" | "default" | "strong"

const LEVEL: Record<GlassLevel, string> = { subtle: "gl-subtle", default: "", strong: "gl-strong" }

type PanelTag = "div" | "section" | "aside" | "article" | "header" | "footer" | "nav" | "li"

/**
 * A frosted glass surface (24px radius). `plain` drops the backdrop blur:
 * use it for repeated items (cards in a list) whose container already blurs.
 */
export function GlassPanel({
  as: Tag = "div",
  level = "default",
  plain = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: PanelTag; level?: GlassLevel; plain?: boolean }) {
  return <Tag className={cn("gl-surface gl-panel", LEVEL[level], plain && "gl-plain", className)} {...props} />
}

/** The class string for a glass surface, for elements that can't be a GlassPanel (links, list items). */
export function glassSurface({ level = "default", plain = false }: { level?: GlassLevel; plain?: boolean } = {}): string {
  return cn("gl-surface", LEVEL[level], plain && "gl-plain")
}
