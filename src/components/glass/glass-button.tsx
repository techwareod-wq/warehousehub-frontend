import Link from "next/link"
import { cn } from "@/lib/utils"

export type GlassButtonVariant = "primary" | "secondary" | "ghost"
export type GlassButtonSize = "sm" | "md" | "lg" | "icon"

const VARIANT: Record<GlassButtonVariant, string> = {
  primary: "gl-btn-primary",
  secondary: "gl-btn-secondary",
  ghost: "gl-btn-ghost",
}

const SIZE: Record<GlassButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-sm",
  icon: "size-10",
}

/** Classes for a glass button: primary (gold), secondary (glass) or ghost. */
export function glassButton({
  variant = "primary",
  size = "md",
  className,
}: { variant?: GlassButtonVariant; size?: GlassButtonSize; className?: string } = {}): string {
  return cn("gl-btn gl-focus", VARIANT[variant], SIZE[size], className)
}

type Style = { variant?: GlassButtonVariant; size?: GlassButtonSize }

export function GlassButton({ variant, size, className, type = "button", ...props }: React.ComponentProps<"button"> & Style) {
  return <button type={type} className={glassButton({ variant, size, className })} {...props} />
}

/** A link styled as a glass button. */
export function GlassButtonLink({ variant, size, className, ...props }: React.ComponentProps<typeof Link> & Style) {
  return <Link className={glassButton({ variant, size, className })} {...props} />
}
