import { Suspense } from "react"
import { LoadingRows } from "@/components/common"
import { EnquiryInbox } from "@/features/enquiries/components/enquiry-inbox"

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <EnquiryInbox />
    </Suspense>
  )
}
