import { redirect } from "next/navigation"
import { getSiteAccess } from "@/features/users/lib/server-access"
import { NoSiteAccess } from "./no-site-access"

/**
 * Gate for the signed-in-only site pages (Account, Nexus Engine). proxy.ts
 * already sends signed-out visitors to sign-in; this covers a stale session
 * and shows "no access yet" to accounts with no granted features.
 */
export async function RequireSiteAccess({ returnTo, children }: { returnTo: string; children: React.ReactNode }) {
  const access = await getSiteAccess()
  if (access.kind === "signed-out") redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`)
  if (access.profile.features.length === 0) return <NoSiteAccess email={access.profile.email} />
  return <>{children}</>
}
