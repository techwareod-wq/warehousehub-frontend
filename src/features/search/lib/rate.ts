import { formatMoney } from "@/lib/format"
import type { Rate } from "../entities/search.entity"

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
