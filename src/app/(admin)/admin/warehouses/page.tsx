import { Suspense } from "react"
import { LoadingRows } from "@/components/common"
import { WarehouseList } from "@/features/catalog/components/warehouse-list"

export default function WarehousesPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <WarehouseList />
    </Suspense>
  )
}
