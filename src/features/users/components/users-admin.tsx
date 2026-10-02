"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { Checkbox, EmptyState, ErrorState, FormRow, LoadingRows, NativeSelect, PageHeader, Pager } from "@/components/common"
import { ApiError, browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { formatDate } from "@/lib/format"
import { usersApi } from "../api/users.api"
import type { AssignablePermission, User } from "../entities/users.entity"

const api = usersApi(browserApi)

const PERMS: { key: AssignablePermission; label: string; description: string }[] = [
  { key: "editor", label: "Editor", description: "Edit listing drafts, answer needs-info, work the enquiry inbox." },
  { key: "approver", label: "Approver", description: "Approve / reject, archive / restore, read the change log and analytics." },
  { key: "attributes", label: "Attributes", description: "Edit the attribute tree and industry rules." },
]

function AccessDialog({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState<"user" | "admin">(user.role === "admin" ? "admin" : "user")
  const [perms, setPerms] = useState<AssignablePermission[]>(PERMS.filter((p) => user.can[p.key]).map((p) => p.key))
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Access for {user.email}</DialogTitle>
        </DialogHeader>
        <FormRow label="Role">
          <NativeSelect
            value={role}
            onChange={(r) => setRole(r as "user" | "admin")}
            options={[
              { value: "user", label: "User — public site only" },
              { value: "admin", label: "Admin — admin panel" },
            ]}
          />
        </FormRow>
        {role === "admin" && (
          <div className="flex flex-col gap-3">
            {PERMS.map((p) => (
              <Checkbox
                key={p.key}
                checked={perms.includes(p.key)}
                onChange={(on) => setPerms((cur) => (on ? [...cur, p.key] : cur.filter((x) => x !== p.key)))}
                label={p.label}
                description={p.description}
              />
            ))}
            {perms.length === 0 && <p className="text-xs text-muted-foreground">With no permissions an admin can look but not change anything.</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await api.setAccess({ userId: user.id, role, permissions: perms, roleVersion: user.roleVersion })
                toast.success("Access updated — it applies on their next page load")
                onSaved()
              } catch (err) {
                if (err instanceof ApiError && err.code === "access_conflict") {
                  toast.error("Their access changed meanwhile — reloaded, try again.")
                  onSaved()
                } else toast.error(errorMessage(err))
              } finally {
                setBusy(false)
              }
            }}
          >
            Save access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Users & access (superuser): staff sign in once, then get their access here (D-110). */
export function UsersAdmin() {
  const [q, setQ] = useState("")
  const [applied, setApplied] = useState("")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<User | null>(null)
  const list = useLoad(() => api.list({ q: applied, page }), [applied, page])

  return (
    <>
      <PageHeader title="Users & access" description="New staff sign in on the site once, then find them here and give them access." />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setApplied(q.trim())
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name" className="w-72" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {list.status === "error" && !list.data ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <LoadingRows />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "user" ? "outline" : "default"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.role === "superuser" ? (
                          <span className="text-xs text-muted-foreground">everything</span>
                        ) : (
                          PERMS.filter((p) => u.can[p.key]).map((p) => (
                            <Badge key={p.key} variant="secondary">
                              {p.label}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {u.role !== "superuser" && (
                        <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                          Edit access
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={list.data.page} pages={list.data.pages} total={list.data.total} onPage={setPage} />
        </>
      )}
      {editing && (
        <AccessDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            list.reload()
          }}
        />
      )}
    </>
  )
}
