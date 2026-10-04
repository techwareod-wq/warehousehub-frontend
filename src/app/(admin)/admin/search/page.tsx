import { Suspense } from "react"
import { LoadingRows } from "@/components/common"
import { AdminSearch } from "@/features/search/components/admin-search"

export default function AdminSearchPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <AdminSearch />
    </Suspense>
  )
}
