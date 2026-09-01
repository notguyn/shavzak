import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  /** Key under the `nav` namespace. */
  labelKey: string
  icon: LucideIcon
}

export interface NavSection {
  /** Key under the `nav` namespace. */
  titleKey: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "sectionMain",
    items: [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { href: "/soldiers", labelKey: "soldiers", icon: Users },
      { href: "/assignments", labelKey: "assignments", icon: ClipboardList },
      { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
    ],
  },
  {
    titleKey: "sectionPlanning",
    items: [
      { href: "/shavzak", labelKey: "shavzak", icon: CalendarRange },
      { href: "/boards", labelKey: "boards", icon: CalendarDays },
      { href: "/constraints", labelKey: "constraints", icon: ListChecks },
      { href: "/analytics", labelKey: "analytics", icon: ShieldCheck },
    ],
  },
  {
    titleKey: "sectionSystem",
    items: [
      { href: "/audit", labelKey: "audit", icon: ScrollText },
      { href: "/settings", labelKey: "settings", icon: Settings },
    ],
  },
]
