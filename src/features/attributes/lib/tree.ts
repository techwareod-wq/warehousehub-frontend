import type { AttributeField, AttributeNode, AttributeTree, Comparator, FieldType } from "../entities/attributes.entity"

export const ROOT_KEY = "warehouse"

/** "Cold storage › Temperature" for a needs-info / condition path. */
export function pathLabel(tree: AttributeTree, path: string): string {
  const [nodeKey, fieldKey] = path.split(".")
  const node = tree.byKey[nodeKey]
  if (!node) return path
  if (!fieldKey) return node.name
  const field = node.fields.find((f) => f.key === fieldKey)
  return `${node.name} › ${field?.name ?? fieldKey}`
}

export function findField(tree: AttributeTree, path: string): { node: AttributeNode; field: AttributeField } | null {
  const [nodeKey, fieldKey] = path.split(".")
  const node = tree.byKey[nodeKey]
  const field = node?.fields.find((f) => f.key === fieldKey)
  return node && field ? { node, field } : null
}

/** Every field path "<node>.<field>" whose type is numeric (ratio sources). */
export function numericFieldPaths(tree: AttributeTree): { path: string; label: string }[] {
  const out: { path: string; label: string }[] = []
  for (const n of tree.nodes) {
    for (const f of n.fields) {
      if (f.type === "number" || f.type === "area") out.push({ path: `${n.key}.${f.key}`, label: `${n.name} › ${f.name}` })
    }
  }
  return out
}

/** True when `maybeDescendant` sits under `key` (move targets). */
export function isDescendant(tree: AttributeTree, key: string, maybeDescendant: string): boolean {
  let cur = tree.byKey[maybeDescendant]
  while (cur && cur.parentKey) {
    if (cur.parentKey === key) return true
    cur = tree.byKey[cur.parentKey]
  }
  return false
}

/** Comparators valid for a condition target (crunch domain/conditions.go). */
export function comparatorsFor(type: FieldType | null): Comparator[] {
  switch (type) {
    case null:
      return ["is_yes"]
    case "bool":
      return ["eq"]
    case "number":
    case "area":
    case "ratio":
      return ["gte", "lte", "eq"]
    case "range":
      return ["gte", "lte"]
    case "pick":
      return ["eq", "in"]
    case "multi":
      return ["contains", "in", "contains_all"]
    default:
      return []
  }
}

export function conditionableFields(node: AttributeNode): AttributeField[] {
  return node.fields.filter((f) => comparatorsFor(f.type).length > 0)
}
