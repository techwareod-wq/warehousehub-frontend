import Link from "next/link"
import { Lock } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { Button, buttonVariants } from "@/components/ui"

/** A signed-in visitor who hasn't been given any site access yet. */
export function NoSiteAccess({ email }: { email?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <Lock className="size-8 text-muted-foreground" />
      <h1 className="font-heading text-3xl tracking-tight">You don&apos;t have access yet</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {email ? `${email} is signed in` : "You're signed in"}, but your account hasn&apos;t been given access to the site. Ask the team to
        turn it on, then reload this page.
      </p>
      <SignOutButton>
        <Button variant="ghost">Sign out</Button>
      </SignOutButton>
    </div>
  )
}

/** A visitor with some access, but not to this page's feature. */
export function FeatureNotIncluded({ what }: { what: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <Lock className="size-8 text-muted-foreground" />
      <h1 className="font-heading text-3xl tracking-tight">{what} isn&apos;t on for your account</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Ask the team to turn it on, then reload this page.</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Home
      </Link>
    </div>
  )
}
