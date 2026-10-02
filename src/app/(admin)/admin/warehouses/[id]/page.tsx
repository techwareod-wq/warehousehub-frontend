import { WarehouseEditor } from "@/features/catalog/components/warehouse-editor"

export default async function WarehousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WarehouseEditor id={id} />
}
