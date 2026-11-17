import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { SiteAccessProvider } from "@/features/users"
import { getSiteFeatures } from "@/features/users/lib/server-access"

// The access verdict must never be cached: the profile is read on every request.
export const dynamic = "force-dynamic"

/**
 * Layout for the public site. Home, Explore, Finder, Search, warehouse pages
 * and Contact are open to everyone; Account and Nexus Engine need sign-in
 * (proxy.ts) and some granted access (RequireSiteAccess on those pages).
 * The provider carries the visitor's effective features (public + granted).
 * The public site is always dark (the admin panel has its own theme toggle);
 * .site swaps in the public palette and type, .gl-page the liquid-glass
 * backdrop (navy with fixed glows, globals.css).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const features = await getSiteFeatures()
  return (
    <SiteAccessProvider features={features}>
      <div className="dark site gl-page flex min-h-full flex-1 flex-col text-foreground">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </SiteAccessProvider>
  )
}
