import { redirect } from "next/navigation"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { NoSiteAccess } from "@/components/site/no-site-access"
import { SiteAccessProvider } from "@/features/users"
import { getSiteAccess } from "@/features/users/lib/server-access"

// The access verdict must never be cached: the profile is read on every request.
export const dynamic = "force-dynamic"

/**
 * Server gate for the public site: every visitor route is feature-gated by
 * the backend for now, so a visitor with no features sees "no access yet".
 * Pages check their own feature (getSiteAccess is shared per request).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const access = await getSiteAccess()
  if (access.kind === "signed-out") redirect("/sign-in")
  const { features, email } = access.profile
  return (
    <SiteAccessProvider features={features}>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{features.length === 0 ? <NoSiteAccess email={email} /> : children}</main>
      <SiteFooter />
    </SiteAccessProvider>
  )
}
