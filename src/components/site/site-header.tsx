import Link from "next/link"
import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { Warehouse } from "lucide-react"
import { Button } from "@/components/ui"
import { env } from "@/core/config/env"
import { hasSiteFeature } from "@/features/users/lib/server-access"

export async function SiteHeader() {
  const [canSearch, canEnquire] = await Promise.all([hasSiteFeature("search"), hasSiteFeature("enquiries")])
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Warehouse className="size-4" />
          </span>
          {env.siteName}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {canSearch && (
            <Link href="/search" className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Search
            </Link>
          )}
          {canEnquire && (
            <Link href="/enquire" className="hidden rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline">
              Get help finding space
            </Link>
          )}
          <Show when="signed-in">
            <Link href="/account" className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Account
            </Link>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">
                Sign in
              </Button>
            </SignInButton>
          </Show>
        </nav>
      </div>
    </header>
  )
}
