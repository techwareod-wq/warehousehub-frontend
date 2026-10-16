import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { FinderPage, finderEnabled } from "@/features/finder"
import { hasSiteFeature } from "@/features/users/lib/server-access"

export const metadata: Metadata = {
  title: "Warehouse finder",
  description: "Answer a few questions and get your best-matching warehouses.",
}

/** EXPERIMENTAL: hidden entirely unless NEXT_PUBLIC_ENABLE_FINDER=true. */
export default async function FindRoute() {
  if (!finderEnabled) notFound()
  if (!(await hasSiteFeature("search"))) return <FeatureNotIncluded what="Search" />
  return <FinderPage />
}
