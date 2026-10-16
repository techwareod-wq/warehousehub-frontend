import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
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
              <button
                type="button"
                className="rounded-full border border-white/35 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:border-white/80 hover:bg-white/10 lg:px-6 lg:text-xs"
              >
                Log in
              </button>
            </SignInButton>
          </Show>
        </>
      }
    />
  )
}
