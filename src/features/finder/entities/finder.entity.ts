import type { Rate } from "@/features/search"

export type WarehouseType = "" | "general" | "bonded" | "ftwz"
export type GoodsKind = "general" | "dg" | "cold"
export type FinderIndustry = "pharma" | "ecommerce" | "chemicals"

export const TYPE_OPTIONS: { value: WarehouseType; label: string }[] = [
  { value: "", label: "Any" },
  { value: "general", label: "General" },
  { value: "bonded", label: "Bonded" },
  { value: "ftwz", label: "FTWZ" },
]

export const GOODS_OPTIONS: { value: GoodsKind; label: string }[] = [
  { value: "general", label: "General" },
  { value: "dg", label: "Dangerous Goods (DG)" },
  { value: "cold", label: "Cold / Temperature-controlled" },
]

export const INDUSTRY_OPTIONS: { value: FinderIndustry; label: string }[] = [
  { value: "pharma", label: "Pharma" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "chemicals", label: "Chemicals" },
]

/** What the visitor answered in the finder steps. */
export interface FinderAnswers {
  city: string
  type: WarehouseType
  /** sq ft; null until typed. */
  areaSqft: number | null
  goods: GoodsKind[]
  industries: FinderIndustry[]
  nearPort: boolean
  nearRail: boolean
}

export const EMPTY_ANSWERS: FinderAnswers = {
  city: "",
  type: "",
  areaSqft: null,
  goods: [],
  industries: [],
  nearPort: false,
  nearRail: false,
}

export interface FinderMatch {
  shortId: string
  slug: string
  name: string
  city: string
  locality: string
  totalSqm: number
  rate: Rate | null
  coverUrl: string
  matchPercent: number
  matched: string[]
  typeUnknown: boolean
  reason: string
}

export interface FinderResult {
  results: FinderMatch[]
  message: string
}
