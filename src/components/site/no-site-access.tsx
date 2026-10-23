import { Lock } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { GlassButton, GlassButtonLink, GlassPanel } from "@/components/glass"

function Notice({ title, children, action }: { title: React.ReactNode; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <GlassPanel className="flex w-full max-w-md flex-col items-center gap-3 px-6 py-10 text-center sm:px-10">
        <span className="gl-surface gl-plain flex size-12 items-center justify-center rounded-full">
          <Lock aria-hidden className="size-5 text-glass-accent-text" />
        </span>
        <h1 className="font-heading text-3xl tracking-tight">{title}</h1>
        <p className="max-w-sm text-sm text-glass-text-3">{children}</p>
        {action}
      </GlassPanel>
    </div>
  )
}

/** A signed-in visitor who hasn't been given any site access yet. */
export function NoSiteAccess({ email }: { email?: string }) {
  return (
    <Notice
      title={<>You don&apos;t have access yet</>}
      action={
        <SignOutButton>
          <GlassButton variant="ghost">Sign out</GlassButton>
        </SignOutButton>
      }
    >
      {email ? `${email} is signed in` : "You're signed in"}, but your account hasn&apos;t been given access to the site. Ask the team to
      turn it on, then reload this page.
    </Notice>
  )
}

/** A visitor with some access, but not to this page's feature. */
export function FeatureNotIncluded({ what }: { what: string }) {
  return (
    <Notice
      title={<>{what} isn&apos;t on for your account</>}
      action={
        <GlassButtonLink href="/" variant="secondary">
          Home
        </GlassButtonLink>
      }
    >
      Ask the team to turn it on, then reload this page.
    </Notice>
  )
}
