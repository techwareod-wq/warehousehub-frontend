import { Suspense } from "react"
import { LoadingRows } from "@/components/common"
import { ChangeLog } from "@/features/changes/components/change-log"

export default function ChangesPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <ChangeLog />
    </Suspense>
  )
}
