"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  getAriaLabel,
  ...props
}: SliderPrimitive.Root.Props & { getAriaLabel?: (index: number) => string }) {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative w-full touch-none select-none data-disabled:opacity-50", className)}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-5 w-full items-center">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-muted">
          <SliderPrimitive.Indicator className="rounded-full bg-primary" />
        </SliderPrimitive.Track>
        {values.map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            index={i}
            getAriaLabel={getAriaLabel}
            className="block size-4 rounded-full border-2 border-primary bg-background shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
