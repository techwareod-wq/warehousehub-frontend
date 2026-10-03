import type { Metadata } from "next"
import { Suspense } from "react"
import { LoadingRows } from "@/components/common"
import { SearchPage } from "@/features/search"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { hasSiteFeature } from "@/features/users/lib/server-access"

export const metadata: Metadata = {
  title: "Search warehouses",
  description: "Search warehouse space by location, size, rent and facilities.",
}

export default async function SearchRoute() {
  if (!(await hasSiteFeature("search"))) return <FeatureNotIncluded what="Search" />
  const catalog = await loadFilterCatalog()
  return (
    <Suspense fallback={<LoadingRows rows={4} className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6" />}>
      <SearchPage catalog={catalog} />
    </Suspense>
  )
}
