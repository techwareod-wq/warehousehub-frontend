"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Fades its content up the first time it scrolls into view. The hidden state
 * is motion-safe only, so reduced-motion visitors (and no-JS renders for
 * them) always see the content in place. `delay` staggers siblings (ms).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: "div" | "li" | "section"
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as React.Ref<never>}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </Tag>
  )
}
