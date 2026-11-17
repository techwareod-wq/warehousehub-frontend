import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { GlassButton } from "@/components/glass"
import { glassClerkAppearance } from "@/components/glass/clerk-appearance"
import { canOfferEnquiry } from "@/features/users/lib/server-access"
import { SiteNav } from "./site-nav"

export async function SiteHeader() {
  const [canEnquire, { userId }] = await Promise.all([canOfferEnquiry(), auth()])
  return (
    <SiteNav
      canEnquire={canEnquire}
      signedIn={!!userId}
      actions={
        <>
          <Show when="signed-in">
            <UserButton appearance={glassClerkAppearance} />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal" appearance={glassClerkAppearance}>
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
