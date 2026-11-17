import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FinderPage, finderEnabled } from "@/features/finder"

export const metadata: Metadata = {
  title: "Warehouse finder",
  description: "Answer a few questions and get your best-matching warehouses.",
}

/** EXPERIMENTAL: on by default; NEXT_PUBLIC_ENABLE_FINDER=false hides it. Open to everyone. */
export default function FindRoute() {
  if (!finderEnabled) notFound()
  return <FinderPage />
}
