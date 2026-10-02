/** crunch models.AttributeField */
export interface AttributeFieldNetwork {
  key: string
  name: string
  description?: string
  order: number
  type: string
  required: boolean
  locked: boolean
  unit?: { family: string; input?: string[] | null } | null
  options?: { key: string; label: string; order: number }[] | null
  ratio?: { top: string; bottom: string; per: number; bottomUnit?: string } | null
  validations?: { kind: string; value: unknown; message?: string }[] | null
  public: boolean
  filterable: boolean
  filterRow?: string
  filterPos: number
}

/** crunch domain.TreeNode (models.AttributeNode flattened + children) */
export interface AttributeNodeNetwork {
  id: string
  key: string
  parentKey: string
  name: string
  description?: string
  order: number
  system: boolean
  public: boolean
  filterable: boolean
  filterRow?: string
  filterPos: number
  synonyms?: string[] | null
  fields: AttributeFieldNetwork[] | null
  version: number
  updatedBy: string
  updatedAt: string
  children?: AttributeNodeNetwork[] | null
}

/** GET /v1/admin/attributes/tree */
export interface TreeResponseNetwork {
  rulesVersion: number
  tree: AttributeNodeNetwork[] | null
  validations: Record<string, string[]> | null
}

/** crunch models.Condition */
export interface ConditionNetwork {
  node: string
  field?: string
  cmp: string
  value?: unknown
}

/** crunch models.Industry */
export interface IndustryNetwork {
  id: string
  key: string
  name: string
  order: number
  required: ConditionNetwork[] | null
  preferred: ConditionNetwork[] | null
  version: number
  updatedBy: string
  updatedAt: string
}

/** GET /v1/admin/industries */
export interface IndustriesResponseNetwork {
  rulesVersion: number
  items: IndustryNetwork[] | null
}

export interface WriteResultNetwork {
  rulesVersion: number
  changed: string[] | null
}

export interface NodeResponseNetwork extends WriteResultNetwork {
  node: AttributeNodeNetwork
}

export interface IndustryResponseNetwork extends WriteResultNetwork {
  industry: IndustryNetwork
}

/** Hard-delete preview / result (superuser). */
export interface DeleteResponseNetwork extends WriteResultNetwork {
  nodes: string[] | null
  warehouses: number
  blockedBy: string[] | null
  batchId?: string
}

// --- request bodies ---

export interface CreateNodeRequestNetwork {
  node: Omit<AttributeNodeNetwork, "id" | "version" | "updatedBy" | "updatedAt" | "children" | "system">
  default: "unknown" | "no"
}

export interface NodePatchNetwork {
  key: string
  expectedVersion: number
  name?: string
  description?: string
  public?: boolean
  filterable?: boolean
  filterRow?: string
  filterPos?: number
  synonyms?: string[]
}

export interface MoveNodeRequestNetwork {
  key: string
  expectedVersion: number
  newParentKey: string
  order: number
}

export interface ReorderNodesRequestNetwork {
  parentKey: string
  keys: string[]
}

export interface FieldRequestNetwork {
  node: string
  expectedVersion: number
  field: AttributeFieldNetwork
}

export interface ReorderFieldsRequestNetwork {
  node: string
  expectedVersion: number
  keys: string[]
}

export interface DeleteTargetNetwork {
  node: string
  field?: string
  option?: string
  expectedVersion: number
  confirm: boolean
}

export interface IndustryPatchNetwork {
  key: string
  expectedVersion: number
  name?: string
  order?: number
  required?: ConditionNetwork[]
  preferred?: ConditionNetwork[]
}
