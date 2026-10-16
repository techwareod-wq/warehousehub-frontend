import { formatMoney } from "@/lib/format"
import { SQM_PER_SQFT } from "@/lib/units"
import type { Rate } from "../entities/search.entity"

/** ₹ per sq ft per month (from minor units per sq m), null when there is no comparable price. */
export function ratePerSqft(rate: Rate | null): number | null {
  if (!rate || rate.onRequest || rate.perSqmMonth <= 0) return null
  return Math.round(rate.perSqmMonth * SQM_PER_SQFT) / 100
}

const BASIS_SUFFIX: Record<string, string> = {
  per_sqft_month: "/ sq ft / month",
  per_sqm_month: "/ sq m / month",
  flat_month: "/ month",
}

/** "₹28 / sq ft / month", "Price on request". */
export function formatRate(rate: Rate | null): string {
  if (!rate) return "Price on request"
  if (rate.onRequest) return "Price on request"
  return `${formatMoney(rate.amount, rate.currency)} ${BASIS_SUFFIX[rate.basis] ?? ""}`.trim()
}
