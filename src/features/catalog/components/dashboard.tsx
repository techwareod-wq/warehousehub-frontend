"use client"

import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, ClipboardCheck, HelpCircle, Inbox, RefreshCw, Warehouse } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui"
import { PageHeader } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { env } from "@/core/config/env"
import { useLoad } from "@/core/hooks/use-load"
import { useAccess } from "@/features/access"
import { enquiriesApi } from "@/features/enquiries"
import { catalogApi } from "../api/catalog.api"

const catalog = catalogApi(browserApi)
const enquiries = enquiriesApi(browserApi)

function Stat({ title, value, href, icon: Icon, hint }: { title: string; value: number | undefined; href: string; icon: typeof Warehouse; hint: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {value === undefined ? <Skeleton className="h-8 w-16" /> : <span className="text-3xl font-semibold tabular-nums">{value.toLocaleString()}</span>}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
            {hint} <ArrowRight className="size-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export function AdminDashboard() {
  const access = useAccess()
  const stats = useLoad(async () => {
    const [live, queue, needs, fresh] = await Promise.all([
      catalog.list({ status: "live", limit: 1 }).then((p) => p.total),
      catalog.queue(1, 1).then((p) => p.total),
      catalog.needsInfoSummary().then((items) => items.reduce((s, i) => s + i.count, 0)),
      access.can.editor ? enquiries.list({ status: "new" }, 1, 1).then((p) => p.total) : Promise.resolve(undefined),
    ])
    return { live, queue, needs, fresh }
  }, [])

  const reembed = async () => {
    try {
      await browserApi.post("/v1/admin/aisearch/reembed-all")
      toast.success("Re-embedding started — it runs in the background.")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title={`Welcome${access.name ? `, ${access.name.split(" ")[0]}` : ""}`} description="What needs attention today." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Live warehouses" value={stats.data?.live} href="/admin/warehouses?status=live" icon={Warehouse} hint="Browse listings" />
        <Stat title="Waiting for review" value={stats.data?.queue} href="/admin/review" icon={ClipboardCheck} hint="Open the queue" />
        <Stat title="Missing information" value={stats.data?.needs} href="/admin/needs-info" icon={HelpCircle} hint="Fill the gaps" />
        {access.can.editor && <Stat title="New enquiries" value={stats.data?.fresh} href="/admin/enquiries?status=new" icon={Inbox} hint="Open the inbox" />}
      </div>
      {stats.status === "error" && <p className="text-sm text-destructive">{errorMessage(stats.error)}</p>}
      {access.can.superuser && env.aiSearchEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI search</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Rebuild the embeddings for every live listing (after a model change or the first bulk import).</p>
            <Button variant="outline" onClick={reembed}>
              <RefreshCw /> Re-embed all
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}
