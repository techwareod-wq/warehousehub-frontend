"use client"

import { createContext, useContext } from "react"
import type { SiteFeature } from "../entities/users.entity"

const SiteFeaturesContext = createContext<SiteFeature[]>([])

export function SiteAccessProvider({ features, children }: { features: SiteFeature[]; children: React.ReactNode }) {
  return <SiteFeaturesContext.Provider value={features}>{children}</SiteFeaturesContext.Provider>
}

/** Whether the visitor may use a site feature. False outside the (site) layout. */
export function useSiteFeature(feature: SiteFeature): boolean {
  return useContext(SiteFeaturesContext).includes(feature)
}
