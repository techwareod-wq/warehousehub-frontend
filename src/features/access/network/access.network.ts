/** GET /v1/admin/whoami */
export interface WhoamiNetwork {
  id: string
  email: string
  name: string
  role: string
  permissions: string[] | null
}

/** GET /v1/admin/staff → {items} */
export interface StaffMemberNetwork {
  id: string
  email: string
  name: string
  role: string
  permissions: string[] | null
}

export interface StaffListNetwork {
  items: StaffMemberNetwork[] | null
}
