import type { StaffMemberNetwork, WhoamiNetwork } from "../network/access.network"
import type { Access, PermissionSet, Role, StaffMember } from "../entities/access.entity"

export function toPermissionSet(perms: string[] | null | undefined): PermissionSet {
  const has = (p: string) => (perms ?? []).includes(p)
  return {
    admin: has("admin"),
    editor: has("editor"),
    approver: has("approver"),
    attributes: has("attributes"),
    superuser: has("superuser"),
  }
}

export function toRole(role: string): Role {
  return role === "admin" || role === "superuser" ? role : "user"
}

export function toAccess(n: WhoamiNetwork): Access {
  return { id: n.id, email: n.email, name: n.name, role: toRole(n.role), can: toPermissionSet(n.permissions) }
}

export function toStaffMember(n: StaffMemberNetwork): StaffMember {
  return { id: n.id, email: n.email, name: n.name, role: toRole(n.role), can: toPermissionSet(n.permissions) }
}
