"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { ArrowLeft, Menu, Monitor, Moon, ShieldCheck, Sun } from "lucide-react"
import { ThemeProvider, useTheme } from "next-themes"
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

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

const noopSubscribe = () => () => {}

/** Light / dark / system for the admin panel (the public site is always dark). */
function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  // The stored theme is only known in the browser; render unselected on the server.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
  return (
    <div className="flex gap-0.5 self-start rounded-full bg-zinc-900 p-0.5" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => {
        const on = mounted && theme === t.value
        return (
          <button
            key={t.value}
            role="radio"
            aria-checked={on}
            aria-label={t.label}
            title={t.label}
            onClick={() => setTheme(t.value)}
            className={cn("rounded-full p-1.5 transition-colors", on ? "bg-zinc-700 text-zinc-50" : "text-zinc-500 hover:text-zinc-200")}
          >
            <t.icon className="size-3.5" />
          </button>
        )
      })}
    </div>
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
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200">
            <ArrowLeft className="size-3.5" /> Public site
          </Link>
          <ThemeSwitch />
        </div>
      </div>
    </div>
  )
}

/** Admin chrome: a dark rail (unmistakably not the public site) + content. */
export function AdminShell({ access, children }: { access: Access; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
    </ThemeProvider>
  )
}
