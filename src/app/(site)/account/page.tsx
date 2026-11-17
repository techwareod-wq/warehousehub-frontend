import type { Metadata } from "next"
import { PageHeader } from "@/components/common"
import { GlassPanel } from "@/components/glass"
import { RequireSiteAccess } from "@/components/site/require-site-access"
import { ProfileForm } from "@/features/users"

export const metadata: Metadata = { title: "Your account", robots: { index: false } }

/** Signed-in only (proxy.ts), and the account needs some granted access. */
export default function AccountPage() {
  return (
    <RequireSiteAccess returnTo="/account">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <PageHeader title="Your account" description="Contact details we use when you send an enquiry." />
        <GlassPanel className="p-6 sm:p-8">
          <ProfileForm />
        </GlassPanel>
      </div>
    </RequireSiteAccess>
  )
}
