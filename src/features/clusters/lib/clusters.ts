import type { ListingCard } from "@/features/search"
import { ratePerSqft } from "@/features/search/lib/rate"
import type { Cluster, ClusterOverview } from "../entities/clusters.entity"

/**
 * A listing as the cluster logic sees it. `cluster` is the hub the backend
 * assigns to a warehouse.
 *
 * TODO(cluster-field): crunch doesn't send `cluster` yet. When it does, add
 * `cluster?: string` to SearchCardNetwork (exact Go JSON tag), carry it on
 * ListingCard via toListingCard, and every card will group by it here
 * (one city can then hold several clusters, e.g. Pune: Chakan, Hadapsar,
 * Talegaon). Until then the fallback below groups by city, with the city's
 * localities as sub-hubs. Never hardcode cluster names.
 */
export type ClusterSource = ListingCard & { cluster?: string }

/** Trim and collapse whitespace. */
function clean(s: string | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim()
}

/** The most used spelling of a name; ties go to a capitalised one ("Mumbai" over "mumbai"). */
function pickSpelling(counts: Map<string, number>): string {
  return [...counts.entries()].sort(
    ([a, na], [b, nb]) => nb - na || Number(b[0] !== b[0].toLowerCase()) - Number(a[0] !== a[0].toLowerCase()) || a.localeCompare(b),
  )[0][0]
}

function bump(m: Map<string, number>, k: string) {
  m.set(k, (m.get(k) ?? 0) + 1)
}

interface Group {
  cityNames: Map<string, number>
  clusterNames: Map<string, number>
  /** Lower-cased locality → spellings. */
  localities: Map<string, Map<string, number>>
  cards: ListingCard[]
}

/**
 * Groups live listings into clusters, in one place:
 *  - a card with `cluster` joins that cluster (within its city);
 *  - otherwise it joins its city's cluster, its locality becoming a sub-hub.
 * Names, cities and sub-hubs all come from the listings (matched
 * case-insensitively). Clusters are sorted by listing count, then name, so
 * the busiest hubs lead; a cluster always has at least one listing.
 */
export function buildClusters(cards: ClusterSource[]): ClusterOverview {
  const groups = new Map<string, Group>()
  const cities = new Set<string>()
  for (const c of cards) {
    const city = clean(c.city)
    if (!city) continue
    const cityKey = city.toLowerCase()
    cities.add(cityKey)
    const named = clean(c.cluster)
    const key = named ? `${cityKey}/${named.toLowerCase()}` : cityKey
    const g: Group = groups.get(key) ?? { cityNames: new Map(), clusterNames: new Map(), localities: new Map(), cards: [] }
    bump(g.cityNames, city)
    if (named) bump(g.clusterNames, named)
    const locality = clean(c.locality)
    if (locality && locality.toLowerCase() !== cityKey && locality.toLowerCase() !== named.toLowerCase()) {
      const spellings = g.localities.get(locality.toLowerCase()) ?? new Map<string, number>()
      bump(spellings, locality)
      g.localities.set(locality.toLowerCase(), spellings)
    }
    g.cards.push(c)
    groups.set(key, g)
  }

  const clusters: Cluster[] = []
  for (const [key, g] of groups) {
    const city = pickSpelling(g.cityNames)
    const name = g.clusterNames.size ? pickSpelling(g.clusterNames) : city
    const subHubs = [...g.localities.values()]
      .map((spellings) => ({ name: pickSpelling(spellings), n: [...spellings.values()].reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
      .map((s) => s.name)
    const rates = g.cards.map((c) => ratePerSqft(c.rate)).filter((r): r is number => r !== null)
    clusters.push({
      key,
      name,
      city,
      subHubs,
      listings: g.cards.length,
      rateMin: rates.length ? Math.min(...rates) : null,
      rateMax: rates.length ? Math.max(...rates) : null,
      totalSqm: g.cards.reduce((sum, c) => sum + (c.totalSqm > 0 ? c.totalSqm : 0), 0),
      coverUrl: g.cards.find((c) => c.coverUrl)?.coverUrl ?? "",
      searchPlace: name === city ? city : `${name}, ${city}`,
    })
  }
  clusters.sort((a, b) => b.listings - a.listings || a.name.localeCompare(b.name))
  return { clusters, warehouses: cards.length, cities: cities.size }
}
