import Link from "next/link"
import { buttonVariants } from "@/components/ui"

export default function NotFound() {
  return (
    <div className="dark site flex min-h-screen flex-1 flex-col items-center justify-center gap-3 bg-background px-4 text-center text-foreground">
      <p className="font-heading text-6xl font-black text-site-blue">404</p>
      <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back home
      </Link>
    </div>
  )
}
