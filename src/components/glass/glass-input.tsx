import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** A glass text input (14px radius, gold focus). */
export function GlassInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("gl-input h-11 w-full px-4 text-sm", className)} {...props} />
}

/** A native select in glass. `className` goes on the wrapper (size it there). */
export function GlassSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)}>
      <select className="gl-input h-11 w-full cursor-pointer appearance-none pr-10 pl-4 text-sm" {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-glass-text-3" />
    </div>
  )
}
