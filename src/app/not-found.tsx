import { GlassButtonLink, GlassPanel } from "@/components/glass"

export default function NotFound() {
  return (
    <div className="dark site gl-page flex min-h-screen flex-1 flex-col items-center justify-center px-4 text-center text-foreground">
      <GlassPanel className="flex w-full max-w-md flex-col items-center gap-3 px-6 py-12 sm:px-10">
        <p className="font-heading text-6xl font-black text-glass-accent-text">404</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Page not found</h1>
        <p className="max-w-sm text-sm text-glass-text-3">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <GlassButtonLink href="/" variant="secondary" className="mt-2">
          Back home
        </GlassButtonLink>
      </GlassPanel>
    </div>
  )
}
