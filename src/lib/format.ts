import { formatDistanceToNowStrict } from "date-fns"
import { sqmToSqft } from "./units"

/** Minor units → major for display (every launch currency has 2 decimals). */
export function minorToMajor(amount: number): number {
  return amount / 100
}

export function majorToMinor(amount: number): number {
  return Math.round(amount * 100)
}

export function formatMoney(amountMinor: number, currency: string, opts: { compact?: boolean } = {}): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: amountMinor % 100 === 0 || opts.compact ? 0 : 2,
      notation: opts.compact ? "compact" : "standard",
    }).format(minorToMajor(amountMinor))
  } catch {
    return `${currency} ${minorToMajor(amountMinor).toLocaleString()}`
  }
}

export function formatNumber(v: number, digits = 0): string {
  return v.toLocaleString("en-IN", { maximumFractionDigits: digits })
}

/** "12,000 sq ft" from canonical sq m. */
export function formatAreaSqft(sqm: number): string {
  return `${formatNumber(Math.round(sqmToSqft(sqm)))} sq ft`
}

export function formatDate(d: Date | undefined | null): string {
  if (!d) return "—"
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export function formatDateTime(d: Date | undefined | null): string {
  if (!d) return "—"
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function formatRelative(d: Date | undefined | null): string {
  if (!d) return "—"
  return `${formatDistanceToNowStrict(d)} ago`
}

export function formatPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

/** Parses an API timestamp; undefined for empty / zero times. */
export function parseDate(v: string | null | undefined): Date | undefined {
  if (!v || v.startsWith("0001-01-01")) return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** YYYY-MM-DD in local time. */
export function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
