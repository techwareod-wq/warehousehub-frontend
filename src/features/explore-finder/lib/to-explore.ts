import type { ExploreWarehouse } from "@/features/explore/entities/explore.entity"
import type { FinderWarehouse } from "../entities/finder.entity"

/** Finder results as Explore map markers, so Explore's own cluster layers draw them. Results without a location are skipped. */
export function toExploreMarkers(list: FinderWarehouse[]): ExploreWarehouse[] {
  return list.flatMap((w) =>
    w.loc
      ? [
          {
            shortId: w.shortId,
            slug: w.slug,
            name: w.name,
            city: w.city,
            locality: w.locality,
            lat: w.loc.lat,
            lng: w.loc.lng,
            totalSqm: 0,
            rate: w.rate,
            ratePerSqft: null,
            industries: [],
            coverUrl: w.coverUrl,
          },
        ]
      : [],
  )
}
