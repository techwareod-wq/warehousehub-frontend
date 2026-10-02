/** Panel permissions (crunch internal/authz). */
export type Permission = "admin" | "editor" | "approver" | "attributes" | "superuser"

export type Role = "user" | "admin" | "superuser"

export interface PermissionSet {
  admin: boolean
  editor: boolean
  approver: boolean
  attributes: boolean
  superuser: boolean
}

/** The signed-in staff member and what they may do. */
export interface Access {
  id: string
  email: string
  name: string
  role: Role
  can: PermissionSet
}

export interface StaffMember {
  id: string
  email: string
  name: string
  role: Role
  can: PermissionSet
}
