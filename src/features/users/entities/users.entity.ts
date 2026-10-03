import type { PermissionSet, Role } from "@/features/access"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  can: PermissionSet
  /** Stored site features (staff hold all regardless). */
  features: SiteFeature[]
  phone: string
  company: string
  createdAt?: Date
  /** Opaque CAS token for access edits (role_updated_at as read; null = never edited). */
  roleVersion: string | null
}

export type AssignablePermission = "editor" | "approver" | "attributes"

export interface AccessChange {
  userId: string
  role: "user" | "admin"
  permissions: AssignablePermission[]
  roleVersion: string | null
}

/** A public-site feature a superuser grants per user (crunch authz.Features). */
export type SiteFeature = "search" | "ai_search" | "listings" | "enquiries"

export const SITE_FEATURES: SiteFeature[] = ["search", "ai_search", "listings", "enquiries"]

export interface FeaturesChange {
  userId: string
  features: SiteFeature[]
  roleVersion: string | null
}

/** The visitor's own profile (enquiry prefill + site access). */
export interface Profile {
  email: string
  name: string
  /** What the visitor may use on the site (staff: everything). */
  features: SiteFeature[]
  phone: string
  company: string
}
