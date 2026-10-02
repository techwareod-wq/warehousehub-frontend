import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { AdminShell } from "@/components/admin/admin-shell"
import { NoAccess } from "@/components/admin/no-access"
import { ApiError } from "@/core/api"
import { serverApi } from "@/core/api/server-client"
import { accessApi, type Access } from "@/features/access"

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } }

// The access verdict must never be cached: whoami runs on every request.
export const dynamic = "force-dynamic"

/**
 * Server gate for the admin panel: GET /v1/admin/whoami with the visitor's
 * session. 401 → sign in; 403 → "no access" (a signed-in visitor who isn't
 * staff). The backend enforces every permission again on each call.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let access: Access
  try {
    access = await accessApi(serverApi()).whoami()
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/sign-in?redirect_url=/admin")
    if (err instanceof ApiError && err.status === 403) {
      const user = await currentUser()
      return <NoAccess email={user?.primaryEmailAddress?.emailAddress} />
    }
    throw err
  }
  return <AdminShell access={access}>{children}</AdminShell>
}
