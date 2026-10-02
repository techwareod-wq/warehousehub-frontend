"use client"

import { createContext, useContext } from "react"
import type { Access } from "../entities/access.entity"

const AccessContext = createContext<Access | null>(null)

export function AccessProvider({ access, children }: { access: Access; children: React.ReactNode }) {
  return <AccessContext.Provider value={access}>{children}</AccessContext.Provider>
}

/** The signed-in staff member. Only valid under the admin layout. */
export function useAccess(): Access {
  const a = useContext(AccessContext)
  if (!a) throw new Error("useAccess outside the admin layout")
  return a
}
