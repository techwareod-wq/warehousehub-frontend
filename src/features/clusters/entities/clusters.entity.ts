/**
 * A warehouse cluster: a hub derived from live listings (see buildClusters).
 * Today one per city, its localities as sub-hubs; once warehouses carry a
 * backend `cluster`, one per named cluster. Never a hand-kept list.
 */
export interface Cluster {
  /** "city" or "city/cluster", lower-cased. */
  key: string
  /** The cluster's name, or the city for a city cluster. */
  name: string
  city: string
  /** Localities the cluster's listings name, busiest first. */
  subHubs: string[]
  listings: number
  /** ₹ per sq ft per month over listings with a comparable price; null = all on request. */
  rateMin: number | null
  rateMax: number | null
  /** Sum of listed area, sq m. */
  totalSqm: number
  /** A cover photo from one of the listings ("" if none have one). */
  coverUrl: string
  /** Free text for /search?q= ("Pune", or "Chakan, Pune" for a named cluster). */
  searchPlace: string
}

/** Headline network figures, counted from the same listings. */
export interface ClusterOverview {
  clusters: Cluster[]
  warehouses: number
  cities: number
}
