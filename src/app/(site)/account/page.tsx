import type { Metadata } from "next"
import { PageHeader } from "@/components/common"
import { ProfileForm } from "@/features/users"

export const metadata: Metadata = { title: "Your account", robots: { index: false } }

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <PageHeader title="Your account" description="Contact details we use when you send an enquiry." />
      <ProfileForm />
    </div>
  )
}
