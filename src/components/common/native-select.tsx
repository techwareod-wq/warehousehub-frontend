import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/** A styled native <select>: predictable labels, keyboard and mobile support. */
export function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  size = "default",
  id,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  size?: "sm" | "default"
  id?: string
  "aria-label"?: string
}) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-4xl border border-input bg-input/30 pr-8 pl-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-8" : "h-9",
          value === "" && placeholder && "text-muted-foreground",
        )}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
