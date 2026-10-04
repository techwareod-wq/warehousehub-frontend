import Link from "next/link"
import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Button, buttonVariants } from "@/components/ui"
import { env } from "@/core/config/env"
import { hasSiteFeature } from "@/features/users/lib/server-access"
import { SiteNav } from "./site-nav"

export async function SiteHeader() {
  const [canSearch, canEnquire, { userId }] = await Promise.all([hasSiteFeature("search"), hasSiteFeature("enquiries"), auth()])
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="font-heading text-2xl tracking-tight">
          {env.siteName}
        </Link>
        <SiteNav canSearch={canSearch} canEnquire={canEnquire} signedIn={!!userId} />
        <div className="flex items-center justify-end gap-3">
          {canSearch && (
            <Link href="/search" className={buttonVariants({ size: "sm", className: "md:hidden" })}>
              Search
            </Link>
          )}
          {canEnquire && (
            <Link href="/enquire" className={buttonVariants({ size: "sm", className: "hidden md:inline-flex" })}>
              Tell us what you need
            </Link>
          )}
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">
                Sign in
              </Button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </header>
  )
}
