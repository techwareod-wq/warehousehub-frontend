import type { HttpClient } from "@/core/api"
import type {
  CreateNodeRequestNetwork,
  DeleteResponseNetwork,
  DeleteTargetNetwork,
  FieldRequestNetwork,
  IndustriesResponseNetwork,
  IndustryNetwork,
  IndustryPatchNetwork,
  IndustryResponseNetwork,
  MoveNodeRequestNetwork,
  NodePatchNetwork,
  NodeResponseNetwork,
  ReorderFieldsRequestNetwork,
  ReorderNodesRequestNetwork,
  TreeResponseNetwork,
  WriteResultNetwork,
} from "../network/attributes.network"
import {
  fromCondition,
  fromField,
  fromNodeDraft,
  toDeletePreview,
  toIndustry,
  toIndustryList,
  toNode,
  toTree,
  toWriteResult,
} from "../mappers/attributes.mapper"
import type {
  AttributeField,
  AttributeNode,
  AttributeTree,
  Condition,
  DeletePreview,
  Industry,
  IndustryList,
  NewNodeDefault,
  NodeDraft,
  NodePatch,
  WriteResult,
} from "../entities/attributes.entity"

export interface DeleteTarget {
  node: string
  field?: string
  option?: string
  expectedVersion: number
}

export interface IndustryDraft {
  key: string
  name: string
  order: number
  required: Condition[]
  preferred: Condition[]
}

/** /v1/admin/attributes/* and /v1/admin/industries/* */
export function attributesApi(client: HttpClient) {
  const deletePath = (t: DeleteTarget) =>
    t.option ? "/v1/admin/attributes/options/delete" : t.field ? "/v1/admin/attributes/fields/delete" : "/v1/admin/attributes/nodes/delete"
  const deleteBody = (t: DeleteTarget, confirm: boolean): DeleteTargetNetwork => ({
    node: t.node,
    field: t.field || undefined,
    option: t.option || undefined,
    expectedVersion: t.expectedVersion,
    confirm,
  })

  return {
    async tree(): Promise<AttributeTree> {
      return toTree(await client.get<TreeResponseNetwork>("/v1/admin/attributes/tree"))
    },

    async createNode(draft: NodeDraft, def: NewNodeDefault): Promise<AttributeNode> {
      const body: CreateNodeRequestNetwork = { node: fromNodeDraft(draft), default: def }
      return toNode((await client.post<NodeResponseNetwork>("/v1/admin/attributes/nodes/create", body)).node)
    },

    async updateNode(key: string, expectedVersion: number, patch: NodePatch): Promise<AttributeNode> {
      const body: NodePatchNetwork = { key, expectedVersion, ...patch }
      return toNode((await client.post<NodeResponseNetwork>("/v1/admin/attributes/nodes/update", body)).node)
    },

    async moveNode(key: string, expectedVersion: number, newParentKey: string): Promise<AttributeNode> {
      const body: MoveNodeRequestNetwork = { key, expectedVersion, newParentKey, order: 0 }
      return toNode((await client.post<NodeResponseNetwork>("/v1/admin/attributes/nodes/move", body)).node)
    },

    async reorderNodes(parentKey: string, keys: string[]): Promise<WriteResult> {
      const body: ReorderNodesRequestNetwork = { parentKey, keys }
      return toWriteResult(await client.post<WriteResultNetwork>("/v1/admin/attributes/nodes/reorder", body))
    },

    async createField(node: string, expectedVersion: number, field: AttributeField): Promise<AttributeNode> {
      const body: FieldRequestNetwork = { node, expectedVersion, field: fromField({ ...field, order: 0 }) }
      return toNode((await client.post<NodeResponseNetwork>("/v1/admin/attributes/fields/create", body)).node)
    },

    async updateField(node: string, expectedVersion: number, field: AttributeField): Promise<AttributeNode> {
      const body: FieldRequestNetwork = { node, expectedVersion, field: fromField(field) }
      return toNode((await client.post<NodeResponseNetwork>("/v1/admin/attributes/fields/update", body)).node)
    },

    async reorderFields(node: string, expectedVersion: number, keys: string[]): Promise<AttributeNode> {
      const body: ReorderFieldsRequestNetwork = { node, expectedVersion, keys }
      return toNode((await client.post<NodeResponseNetwork>("/v1/admin/attributes/fields/reorder", body)).node)
    },

    /** Superuser hard delete, step 1: what would go and what blocks it. */
    async previewDelete(target: DeleteTarget): Promise<DeletePreview> {
      return toDeletePreview(await client.post<DeleteResponseNetwork>(deletePath(target), deleteBody(target, false)))
    },

    /** Superuser hard delete, step 2. */
    async confirmDelete(target: DeleteTarget): Promise<DeletePreview> {
      return toDeletePreview(await client.post<DeleteResponseNetwork>(deletePath(target), deleteBody(target, true)))
    },

    async industries(): Promise<IndustryList> {
      return toIndustryList(await client.get<IndustriesResponseNetwork>("/v1/admin/industries"))
    },

    async createIndustry(d: IndustryDraft): Promise<Industry> {
      const body: Partial<IndustryNetwork> = {
        key: d.key.trim(),
        name: d.name.trim(),
        order: d.order,
        required: d.required.map(fromCondition),
        preferred: d.preferred.map(fromCondition),
      }
      return toIndustry((await client.post<IndustryResponseNetwork>("/v1/admin/industries/create", body)).industry)
    },

    async updateIndustry(key: string, expectedVersion: number, d: Omit<IndustryDraft, "key">): Promise<Industry> {
      const body: IndustryPatchNetwork = {
        key,
        expectedVersion,
        name: d.name.trim(),
        order: d.order,
        required: d.required.map(fromCondition),
        preferred: d.preferred.map(fromCondition),
      }
      return toIndustry((await client.post<IndustryResponseNetwork>("/v1/admin/industries/update", body)).industry)
    },

    async deleteIndustry(key: string, expectedVersion: number): Promise<WriteResult> {
      return toWriteResult(await client.post<WriteResultNetwork>("/v1/admin/industries/delete", { key, expectedVersion }))
    },
  }
}
