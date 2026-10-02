"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { ArrowLeft, Menu, ShieldCheck } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui"
import { env } from "@/core/config/env"
import { AccessProvider, type Access } from "@/features/access"
import { cn } from "@/lib/utils"
import { ADMIN_NAV } from "./admin-nav"

function NavLinks({ access, onNavigate }: { access: Access; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {ADMIN_NAV.filter((i) => i.visible(access.can)).map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active ? "bg-zinc-800 font-medium text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Rail({ access, onNavigate }: { access: Access; onNavigate?: () => void }) {
  const roles = (["editor", "approver", "attributes"] as const).filter((p) => access.can[p])
  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-300">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
        <ShieldCheck className="size-4 text-primary" />
        <span className="text-sm font-semibold text-zinc-100">{env.siteName} admin</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks access={access} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col gap-2 border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2">
          <UserButton />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs text-zinc-200">{access.email}</span>
            <span className="text-[10px] tracking-wider text-zinc-500 uppercase">
              {access.role === "superuser" ? "superuser" : roles.join(" · ") || "read only"}
            </span>
          </div>
        </div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="size-3.5" /> Public site
        </Link>
      </div>
    </div>
  )
}

/** Admin chrome: a dark rail (unmistakably not the public site) + content. */
export function AdminShell({ access, children }: { access: Access; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <AccessProvider access={access}>
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden w-60 shrink-0 md:block">
          <Rail access={access} />
        </aside>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Rail access={access} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex h-12 items-center border-b border-border px-3 md:hidden">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted" aria-label="Open navigation">
              <Menu className="size-5" />
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">{children}</div>
        </div>
      </div>
    </AccessProvider>
  )
}
