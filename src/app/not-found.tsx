import Link from "next/link"
import { buttonVariants } from "@/components/ui"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">404</p>
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back to search
      </Link>
    </div>
  )
}
