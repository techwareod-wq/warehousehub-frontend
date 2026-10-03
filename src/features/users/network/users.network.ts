/** A crunch users doc as the admin API emits it (snake_case timestamps). */
export interface UserNetwork {
  id: string
  clerk_id: string
  email: string
  name: string
  role: string
  permissions?: string[] | null
  /** Stored site features (staff hold all regardless). */
  features?: string[] | null
  role_updated_at?: string | null
  created_at: string
  updated_at: string
  phone?: string
  phoneE164?: string
  company?: string
}

/** GET /v1/admin/users */
export interface UserListNetwork {
  users: UserNetwork[] | null
  page: number
  limit: number
  total: number
}

/** POST /v1/admin/users/access body */
export interface SetAccessRequestNetwork {
  targetUserId: string
  role: string
  permissions: string[]
  expectedRoleUpdatedAt: string | null
}

/** POST /v1/admin/users/features body */
export interface SetFeaturesRequestNetwork {
  targetUserId: string
  features: string[]
  expectedRoleUpdatedAt: string | null
}

/** GET /v1/user/profile and POST /v1/me/profile */
export interface ProfileNetwork {
  id: string
  clerk_id: string
  email: string
  name: string
  role: string
  /** Effective site features (staff: all). */
  features?: string[] | null
  phone: string
  phoneE164: string
  company: string
  profileUpdatedAt?: string
}

export interface UpdateProfileRequestNetwork {
  phone: string
  company: string
}
