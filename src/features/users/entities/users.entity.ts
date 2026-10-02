import type { PermissionSet, Role } from "@/features/access"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  can: PermissionSet
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

/** The visitor's own profile (enquiry prefill). */
export interface Profile {
  email: string
  name: string
  phone: string
  company: string
}
