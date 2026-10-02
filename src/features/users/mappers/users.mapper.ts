import { toPermissionSet, toRole } from "@/features/access"
import { parseDate } from "@/lib/format"
import type { Page } from "@/core/api"
import type { ProfileNetwork, SetAccessRequestNetwork, UserListNetwork, UserNetwork } from "../network/users.network"
import type { AccessChange, Profile, User } from "../entities/users.entity"

export function toUser(n: UserNetwork): User {
  const role = toRole(n.role)
  // The list carries stored permissions; derive the effective set like authz.Effective.
  const stored = toPermissionSet(n.permissions)
  const can =
    role === "superuser"
      ? { admin: true, editor: true, approver: true, attributes: true, superuser: true }
      : { ...stored, admin: role === "admin", superuser: false }
  if (role === "user") {
    can.editor = can.approver = can.attributes = false
  }
  return {
    id: n.id,
    email: n.email,
    name: n.name,
    role,
    can,
    phone: n.phone ?? "",
    company: n.company ?? "",
    createdAt: parseDate(n.created_at),
    roleVersion: n.role_updated_at ?? null,
  }
}

export function toUserPage(n: UserListNetwork): Page<User> {
  const limit = n.limit || 1
  return {
    items: (n.users ?? []).map(toUser),
    page: n.page,
    limit: n.limit,
    total: n.total,
    pages: Math.max(1, Math.ceil(n.total / limit)),
  }
}

export function toSetAccessRequest(c: AccessChange): SetAccessRequestNetwork {
  return {
    targetUserId: c.userId,
    role: c.role,
    permissions: c.role === "admin" ? c.permissions : [],
    expectedRoleUpdatedAt: c.roleVersion,
  }
}

export function toProfile(n: ProfileNetwork): Profile {
  return { email: n.email, name: n.name, phone: n.phone ?? "", company: n.company ?? "" }
}
