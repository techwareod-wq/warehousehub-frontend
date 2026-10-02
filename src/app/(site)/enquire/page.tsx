import type { Metadata } from "next"
import { EnquiryForm } from "@/features/enquiries"

export const metadata: Metadata = {
  title: "Tell us what you need",
  description: "Describe the warehouse space you need and our team will find options for you.",
}

export default function EnquirePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <EnquiryForm />
    </div>
  )
}
