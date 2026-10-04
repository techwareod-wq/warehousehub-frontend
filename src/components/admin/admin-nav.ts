import {
  BarChart3,
  ClipboardCheck,
  Factory,
  HelpCircle,
  History,
  Inbox,
  LayoutDashboard,
  ListTree,
  Search,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react"
import type { PermissionSet } from "@/features/access"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Who sees the item (display only; the backend enforces). */
  visible: (can: PermissionSet) => boolean
}

const any = () => true

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, visible: any },
  { label: "Warehouses", href: "/admin/warehouses", icon: Warehouse, visible: any },
  { label: "Search", href: "/admin/search", icon: Search, visible: any },
  { label: "Review queue", href: "/admin/review", icon: ClipboardCheck, visible: any },
  { label: "Needs info", href: "/admin/needs-info", icon: HelpCircle, visible: any },
  { label: "Enquiries", href: "/admin/enquiries", icon: Inbox, visible: (c) => c.editor },
  { label: "Attributes", href: "/admin/attributes", icon: ListTree, visible: any },
  { label: "Industries", href: "/admin/industries", icon: Factory, visible: any },
  { label: "Search analytics", href: "/admin/analytics", icon: BarChart3, visible: (c) => c.approver },
  { label: "Change log", href: "/admin/changes", icon: History, visible: (c) => c.approver },
  { label: "Users & access", href: "/admin/users", icon: Users, visible: (c) => c.superuser },
]
