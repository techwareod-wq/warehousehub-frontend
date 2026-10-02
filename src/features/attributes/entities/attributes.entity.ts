import type { UnitFamily } from "@/lib/units"

/** Field types (crunch domain/nodes.go). Immutable after creation. */
export const FIELD_TYPES = [
  "bool", "number", "range", "pick", "multi", "text", "longtext",
  "money", "date", "address", "location", "area", "ratio",
] as const
export type FieldType = (typeof FIELD_TYPES)[number]

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  bool: "Yes / no",
  number: "Number",
  range: "Range (min–max)",
  pick: "Pick one",
  multi: "Pick many",
  text: "Short text",
  longtext: "Long text",
  money: "Money",
  date: "Date",
  address: "Address",
  location: "Map pin",
  area: "Area",
  ratio: "Ratio (calculated)",
}

export interface FieldOption {
  key: string
  label: string
  order: number
}

export interface RatioSpec {
  /** Full field paths "<node>.<field>". */
  top: string
  bottom: string
  per: number
  bottomUnit: string
}

export interface FieldValidation {
  kind: string
  value: unknown
  message: string
}

export interface AttributeField {
  key: string
  name: string
  description: string
  order: number
  type: FieldType
  required: boolean
  locked: boolean
  unit: { family: UnitFamily; input: string[] } | null
  options: FieldOption[]
  ratio: RatioSpec | null
  validations: FieldValidation[]
  public: boolean
  filterable: boolean
  filterRow: string
  filterPos: number
}

export interface AttributeNode {
  id: string
  key: string
  parentKey: string
  name: string
  description: string
  order: number
  system: boolean
  public: boolean
  filterable: boolean
  filterRow: string
  filterPos: number
  synonyms: string[]
  fields: AttributeField[]
  /** CAS counter (expectedVersion on writes). */
  version: number
  updatedBy: string
  updatedAt?: Date
  children: AttributeNode[]
  /** 0 for the root. */
  depth: number
}

/** The whole tree at one rulesVersion, with lookups. */
export interface AttributeTree {
  rulesVersion: number
  root: AttributeNode | null
  /** Every node, depth-first (parents before children). */
  nodes: AttributeNode[]
  byKey: Record<string, AttributeNode>
  /** Validation kind → field types it applies to. */
  validationKinds: Record<string, FieldType[]>
}

export type Comparator = "is_yes" | "eq" | "gte" | "lte" | "in" | "contains" | "contains_all"

export const COMPARATOR_LABELS: Record<Comparator, string> = {
  is_yes: "is yes",
  eq: "equals",
  gte: "at least",
  lte: "at most",
  in: "is one of",
  contains: "contains",
  contains_all: "contains all of",
}

export interface Condition {
  node: string
  field: string
  cmp: Comparator
  value: unknown
}

export interface Industry {
  id: string
  key: string
  name: string
  order: number
  required: Condition[]
  preferred: Condition[]
  version: number
  updatedBy: string
  updatedAt?: Date
}

export interface IndustryList {
  rulesVersion: number
  items: Industry[]
}

export interface WriteResult {
  rulesVersion: number
  changed: string[]
}

export interface DeletePreview {
  nodes: string[]
  warehouses: number
  blockedBy: string[]
  batchId: string
}

export type NewNodeDefault = "unknown" | "no"

export interface NodeDraft {
  key: string
  parentKey: string
  name: string
  description: string
  public: boolean
  filterable: boolean
  filterRow: string
  filterPos: number
  synonyms: string[]
}

export type NodePatch = Partial<Omit<NodeDraft, "key" | "parentKey">>
