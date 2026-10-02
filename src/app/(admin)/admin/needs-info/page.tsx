import { Suspense } from "react"
import { LoadingRows } from "@/components/common"
import { NeedsInfo } from "@/features/catalog/components/needs-info"

export default function NeedsInfoPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <NeedsInfo />
    </Suspense>
  )
}
