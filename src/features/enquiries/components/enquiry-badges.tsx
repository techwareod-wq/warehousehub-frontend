import { Badge } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { EnquiryStatus } from "../entities/enquiries.entity"

const STYLES: Record<EnquiryStatus, string> = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  contacted: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  closed: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
}

export function EnquiryStatusBadge({ status, reason }: { status: EnquiryStatus; reason?: string }) {
  return (
    <Badge className={cn("border-transparent capitalize", STYLES[status])}>
      {status}
      {status === "closed" && reason ? ` · ${reason}` : ""}
    </Badge>
  )
}
