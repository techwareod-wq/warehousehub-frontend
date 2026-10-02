import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { Button, buttonVariants } from "@/components/ui"

export function NoAccess({ email }: { email?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <h1 className="font-heading text-xl font-semibold">No admin access</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {email ? `${email} is signed in` : "You're signed in"} but doesn&apos;t have access to the admin panel. Ask a superuser to
        give you access, then reload this page.
      </p>
      <div className="flex gap-2">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Public site
        </Link>
        <SignOutButton>
          <Button variant="ghost">Sign out</Button>
        </SignOutButton>
      </div>
    </div>
  )
}
