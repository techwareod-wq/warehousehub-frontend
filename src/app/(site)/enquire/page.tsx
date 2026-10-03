import type { Metadata } from "next"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { EnquiryForm } from "@/features/enquiries"
import { hasSiteFeature } from "@/features/users/lib/server-access"

export const metadata: Metadata = {
  title: "Tell us what you need",
  description: "Describe the warehouse space you need and our team will find options for you.",
}

export default async function EnquirePage() {
  if (!(await hasSiteFeature("enquiries"))) return <FeatureNotIncluded what="Enquiries" />
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <EnquiryForm />
    </div>
  )
}
