import { parseDate } from "@/lib/format"
import type { UnitFamily } from "@/lib/units"
import type {
  AttributeFieldNetwork,
  AttributeNodeNetwork,
  ConditionNetwork,
  DeleteResponseNetwork,
  IndustryNetwork,
  IndustriesResponseNetwork,
  TreeResponseNetwork,
  WriteResultNetwork,
} from "../network/attributes.network"
import type {
  AttributeField,
  AttributeNode,
  AttributeTree,
  Comparator,
  Condition,
  DeletePreview,
  FieldType,
  Industry,
  IndustryList,
  NodeDraft,
  WriteResult,
} from "../entities/attributes.entity"

export function toField(n: AttributeFieldNetwork): AttributeField {
  return {
    key: n.key,
    name: n.name,
    description: n.description ?? "",
    order: n.order,
    type: n.type as FieldType,
    required: n.required,
    locked: n.locked,
    unit: n.unit ? { family: n.unit.family as UnitFamily, input: n.unit.input ?? [] } : null,
    options: [...(n.options ?? [])].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key)),
    ratio: n.ratio
      ? { top: n.ratio.top, bottom: n.ratio.bottom, per: n.ratio.per, bottomUnit: n.ratio.bottomUnit ?? "" }
      : null,
    validations: (n.validations ?? []).map((v) => ({ kind: v.kind, value: v.value, message: v.message ?? "" })),
    public: n.public,
    filterable: n.filterable,
    filterRow: n.filterRow ?? "",
    filterPos: n.filterPos,
  }
}

export function fromField(f: AttributeField): AttributeFieldNetwork {
  const out: AttributeFieldNetwork = {
    key: f.key.trim(),
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    order: f.order,
    type: f.type,
    required: f.type === "ratio" ? false : f.required,
    locked: f.locked,
    public: f.public,
    filterable: f.filterable,
    filterRow: f.filterRow.trim() || undefined,
    filterPos: f.filterPos,
  }
  if (f.unit && (f.type === "number" || f.type === "range")) {
    out.unit = { family: f.unit.family, input: f.unit.input.length ? f.unit.input : undefined }
  }
  if (f.type === "pick" || f.type === "multi") {
    out.options = f.options.map((o, i) => ({ key: o.key.trim(), label: o.label.trim(), order: i + 1 }))
  }
  if (f.type === "ratio" && f.ratio) {
    out.ratio = { top: f.ratio.top, bottom: f.ratio.bottom, per: f.ratio.per, bottomUnit: f.ratio.bottomUnit || undefined }
  }
  if (f.validations.length) {
    out.validations = f.validations.map((v) => ({ kind: v.kind, value: v.value, message: v.message.trim() || undefined }))
  }
  return out
}

export function toNode(n: AttributeNodeNetwork, depth = 0): AttributeNode {
  return {
    id: n.id,
    key: n.key,
    parentKey: n.parentKey,
    name: n.name,
    description: n.description ?? "",
    order: n.order,
    system: n.system,
    public: n.public,
    filterable: n.filterable,
    filterRow: n.filterRow ?? "",
    filterPos: n.filterPos,
    synonyms: n.synonyms ?? [],
    fields: (n.fields ?? []).map(toField),
    version: n.version,
    updatedBy: n.updatedBy,
    updatedAt: parseDate(n.updatedAt),
    children: (n.children ?? []).map((c) => toNode(c, depth + 1)),
    depth,
  }
}

export function toTree(n: TreeResponseNetwork): AttributeTree {
  const roots = (n.tree ?? []).map((t) => toNode(t))
  const nodes: AttributeNode[] = []
  const walk = (node: AttributeNode) => {
    nodes.push(node)
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  const byKey: Record<string, AttributeNode> = {}
  for (const node of nodes) byKey[node.key] = node
  const validationKinds: Record<string, FieldType[]> = {}
  for (const [kind, types] of Object.entries(n.validations ?? {})) validationKinds[kind] = types as FieldType[]
  return { rulesVersion: n.rulesVersion, root: roots[0] ?? null, nodes, byKey, validationKinds }
}

export function toCondition(n: ConditionNetwork): Condition {
  return { node: n.node, field: n.field ?? "", cmp: n.cmp as Comparator, value: n.value ?? null }
}

export function fromCondition(c: Condition): ConditionNetwork {
  if (c.cmp === "is_yes") return { node: c.node, cmp: c.cmp }
  return { node: c.node, field: c.field, cmp: c.cmp, value: c.value }
}

export function toIndustry(n: IndustryNetwork): Industry {
  return {
    id: n.id,
    key: n.key,
    name: n.name,
    order: n.order,
    required: (n.required ?? []).map(toCondition),
    preferred: (n.preferred ?? []).map(toCondition),
    version: n.version,
    updatedBy: n.updatedBy,
    updatedAt: parseDate(n.updatedAt),
  }
}

export function toIndustryList(n: IndustriesResponseNetwork): IndustryList {
  return { rulesVersion: n.rulesVersion, items: (n.items ?? []).map(toIndustry) }
}

export function toWriteResult(n: WriteResultNetwork): WriteResult {
  return { rulesVersion: n.rulesVersion, changed: n.changed ?? [] }
}

export function toDeletePreview(n: DeleteResponseNetwork): DeletePreview {
  return { nodes: n.nodes ?? [], warehouses: n.warehouses, blockedBy: n.blockedBy ?? [], batchId: n.batchId ?? "" }
}

export function fromNodeDraft(d: NodeDraft) {
  return {
    key: d.key.trim(),
    parentKey: d.parentKey,
    name: d.name.trim(),
    description: d.description.trim() || undefined,
    order: 0,
    public: d.public,
    filterable: d.filterable,
    filterRow: d.filterRow.trim() || undefined,
    filterPos: d.filterPos,
    synonyms: d.synonyms.length ? d.synonyms : undefined,
    fields: [],
  }
}
