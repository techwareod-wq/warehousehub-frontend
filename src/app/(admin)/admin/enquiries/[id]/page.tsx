import { EnquiryDetailView } from "@/features/enquiries/components/enquiry-detail"

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EnquiryDetailView id={id} />
}
