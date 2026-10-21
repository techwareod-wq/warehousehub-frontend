import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { GlassButton } from "@/components/glass"
import { hasSiteFeature } from "@/features/users/lib/server-access"
import { SiteNav } from "./site-nav"

export async function SiteHeader() {
  const [canSearch, canEnquire, { userId }] = await Promise.all([hasSiteFeature("search"), hasSiteFeature("enquiries"), auth()])
  return (
    <SiteNav
      canSearch={canSearch}
      canEnquire={canEnquire}
      signedIn={!!userId}
      actions={
        <>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <GlassButton variant="secondary" size="sm" className="tracking-[0.18em] uppercase">
                Log in
              </GlassButton>
            </SignInButton>
          </Show>
        </>
      }
    />
  )
}
