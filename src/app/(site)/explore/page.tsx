import type { Metadata } from "next"
import { GlobeExplorer } from "@/features/explore"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { hasSiteFeature } from "@/features/users/lib/server-access"

export const metadata: Metadata = {
  title: "Explore warehouses",
  description: "Explore warehouse space across India on an interactive globe and map.",
}

export default async function ExploreRoute() {
  if (!(await hasSiteFeature("search"))) return <FeatureNotIncluded what="Search" />
  const catalog = await loadFilterCatalog()
  // .gl-classic keeps Explore on its own palette (globals.css); `contents` adds no box.
  return (
    <div className="gl-classic contents">
      <GlobeExplorer catalog={catalog} />
    </div>
  )
}
