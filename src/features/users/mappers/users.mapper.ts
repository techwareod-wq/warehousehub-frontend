import { toPermissionSet, toRole } from "@/features/access"
import { parseDate } from "@/lib/format"
import type { Page } from "@/core/api"
import type { ProfileNetwork, SetAccessRequestNetwork, SetFeaturesRequestNetwork, UserListNetwork, UserNetwork } from "../network/users.network"
import { SITE_FEATURES, type AccessChange, type FeaturesChange, type Profile, type SiteFeature, type User } from "../entities/users.entity"

/** Known site features only, in canonical order. */
function toSiteFeatures(raw?: string[] | null): SiteFeature[] {
  return SITE_FEATURES.filter((f) => raw?.includes(f))
}

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
    features: toSiteFeatures(n.features),
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

export function toSetFeaturesRequest(c: FeaturesChange): SetFeaturesRequestNetwork {
  return { targetUserId: c.userId, features: c.features, expectedRoleUpdatedAt: c.roleVersion }
}

export function toProfile(n: ProfileNetwork): Profile {
  return { email: n.email, name: n.name, features: toSiteFeatures(n.features), phone: n.phone ?? "", company: n.company ?? "" }
}
