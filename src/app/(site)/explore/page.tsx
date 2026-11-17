import type { Metadata } from "next"
import { GlobeExplorer } from "@/features/explore"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"

export const metadata: Metadata = {
  title: "Explore warehouses",
  description: "Explore warehouse space across India on an interactive globe and map.",
}

export default async function ExploreRoute() {
  const catalog = await loadFilterCatalog()
  // .gl-classic keeps Explore on its own palette (globals.css); `contents` adds no box.
  return (
    <div className="gl-classic contents">
      <GlobeExplorer catalog={catalog} />
    </div>
  )
}
