"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Checkbox, EmptyState, ErrorState, LoadingRows, PageHeader, Pager } from "@/components/common"
import { browserApi } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { formatDateTime, formatPct, toDateInput } from "@/lib/format"
import { analyticsApi } from "../api/analytics.api"
import type { DateRange } from "../entities/analytics.entity"

const api = analyticsApi(browserApi)

function defaultRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: toDateInput(from), to: toDateInput(to) }
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  )
}

function Overview({ range }: { range: DateRange }) {
  const o = useLoad(() => api.overview(range), [range.from, range.to])
  if (o.status === "error") return <ErrorState error={o.error} onRetry={o.reload} />
  if (!o.data) return <LoadingRows rows={4} />
  const t = o.data.totals
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Searches" value={t.searches.toLocaleString()} hint={`${t.aiSearches.toLocaleString()} described in words`} />
        <Tile label="No results" value={formatPct(t.zeroResultPct)} hint={`${t.zeroResult.toLocaleString()} searches`} />
        <Tile label="Enquiries" value={t.enquiries.toLocaleString()} hint={`${t.enquiriesFromSearch.toLocaleString()} came from a search`} />
        <Tile label="Similar-match fallback" value={formatPct(t.fallbackPct)} hint={t.aiSearches ? `AI parse failures ${formatPct(t.aiParseFailurePct)}` : undefined} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Searches per day</CardTitle>
        </CardHeader>
        <CardContent>
          {o.data.daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">No searches in this range.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={o.data.daily} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "var(--muted-foreground)" }} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--popover-foreground)" }}
                    formatter={(v) => [Number(v).toLocaleString(), "Searches"]}
                  />
                  <Line type="monotone" dataKey="searches" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TopQueries({ range }: { range: DateRange }) {
  const d = useLoad(() => api.top(range), [range.from, range.to])
  if (d.status === "error") return <ErrorState error={d.error} onRetry={d.reload} />
  if (!d.data) return <LoadingRows />
  if (d.data.length === 0) return <EmptyState title="No queries in this range" />
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Query</TableHead>
          <TableHead className="text-right">Searches</TableHead>
          <TableHead className="text-right">No results</TableHead>
          <TableHead className="text-right">Enquiries</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {d.data.map((q) => (
          <TableRow key={q.q}>
            <TableCell>{q.q || <span className="text-muted-foreground">(filters only)</span>}</TableCell>
            <TableCell className="text-right tabular-nums">{q.searches.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPct(q.zeroShare)}</TableCell>
            <TableCell className="text-right tabular-nums">{q.enquiries}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ZeroResults({ range }: { range: DateRange }) {
  const d = useLoad(() => api.zeroResults(range), [range.from, range.to])
  if (d.status === "error") return <ErrorState error={d.error} onRetry={d.reload} />
  if (!d.data) return <LoadingRows />
  if (d.data.length === 0) return <EmptyState title="Every search found something" />
  return (
    <>
      <p className="text-xs text-muted-foreground">What people looked for and didn&apos;t find — the supply to go and get.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query</TableHead>
            <TableHead>Place</TableHead>
            <TableHead className="text-right">Times</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {d.data.map((z, i) => (
            <TableRow key={i}>
              <TableCell>{z.q || "—"}</TableCell>
              <TableCell>{z.place || "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{z.n}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

function ConversionView({ range }: { range: DateRange }) {
  const d = useLoad(() => api.conversion(range), [range.from, range.to])
  if (d.status === "error") return <ErrorState error={d.error} onRetry={d.reload} />
  if (!d.data) return <LoadingRows />
  const c = d.data
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Search → enquiry rate" value={formatPct(c.rate, 2)} />
        <Tile label="Searches with results" value={c.searchesWithResults.toLocaleString()} hint={`of ${c.searches.toLocaleString()}`} />
        <Tile label="Enquiries from search" value={c.enquiriesFromSearch.toLocaleString()} hint={`of ${c.enquiries.toLocaleString()}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By query</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {c.byQuery.map((q) => (
                  <TableRow key={q.q}>
                    <TableCell>{q.q || "(filters only)"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {q.enquiries}/{q.searches}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatPct(q.rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By listing</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {c.byListing.map((l) => (
                  <TableRow key={l.warehouseId}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.enquiries}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{l.fromSearch} from search</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RawLog({ range }: { range: DateRange }) {
  const [q, setQ] = useState("")
  const [applied, setApplied] = useState("")
  const [zero, setZero] = useState(false)
  const [page, setPage] = useState(1)
  const d = useLoad(() => api.log({ q: applied, zero, from: range.from, to: range.to }, page), [applied, zero, page, range.from, range.to])
  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setApplied(q.trim())
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Query contains…" className="w-64" />
        <Checkbox checked={zero} onChange={(v) => (setZero(v), setPage(1))} label="No results only" />
      </form>
      {d.status === "error" && !d.data ? (
        <ErrorState error={d.error} onRetry={d.reload} />
      ) : !d.data ? (
        <LoadingRows />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Results</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.data.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(e.at)}</TableCell>
                  <TableCell>
                    {e.text || "—"}
                    {e.place && <span className="text-muted-foreground"> · {e.place}</span>}
                    {e.aiParsed === false && (
                      <Badge variant="destructive" className="ml-1.5">
                        parse failed
                      </Badge>
                    )}
                    {e.fallbackUsed && (
                      <Badge variant="secondary" className="ml-1.5">
                        fallback
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{e.kind}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.resultCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.latencyMs} ms</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={d.data.page} pages={d.data.pages} total={d.data.total} onPage={setPage} />
        </>
      )}
    </div>
  )
}

/** Search analytics (spec 07): staff searches excluded; raw log kept 90 days. */
export function AnalyticsDashboard() {
  const [range, setRange] = useState<DateRange>(defaultRange)
  return (
    <>
      <PageHeader
        title="Search analytics"
        description="What visitors search for, what they don't find, and what turns into enquiries."
        actions={
          <div className="flex items-center gap-2">
            <Input type="date" value={range.from} onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} className="w-40" aria-label="From" />
            <span className="text-muted-foreground">–</span>
            <Input type="date" value={range.to} onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} className="w-40" aria-label="To" />
          </div>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top">Top queries</TabsTrigger>
          <TabsTrigger value="zero">No results</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="log">Raw log</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-3">
          <Overview range={range} />
        </TabsContent>
        <TabsContent value="top" className="pt-3">
          <TopQueries range={range} />
        </TabsContent>
        <TabsContent value="zero" className="pt-3">
          <ZeroResults range={range} />
        </TabsContent>
        <TabsContent value="conversion" className="pt-3">
          <ConversionView range={range} />
        </TabsContent>
        <TabsContent value="log" className="pt-3">
          <RawLog range={range} />
        </TabsContent>
      </Tabs>
    </>
  )
}
