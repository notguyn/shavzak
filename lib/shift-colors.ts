/** Color-coding for assignment/shift types. Tailwind classes, dark-mode aware. */
export const TYPE_COLORS: Record<string, { bar: string; badge: string }> = {
  GUARD: { bar: "bg-chart-1", badge: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  MISSION: { bar: "bg-chart-3", badge: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
  SHIFT: { bar: "bg-chart-5", badge: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  TRANSPORT: { bar: "bg-chart-2", badge: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  STANDBY: { bar: "bg-chart-4", badge: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  ATTENDANCE: { bar: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
  TASK: { bar: "bg-primary", badge: "bg-primary/15 text-primary border-primary/30" },
}

export function typeColor(type: string) {
  return TYPE_COLORS[type] ?? TYPE_COLORS.TASK
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-chart-2/15 text-chart-2",
  HIGH: "bg-chart-4/15 text-chart-4",
  CRITICAL: "bg-destructive/15 text-destructive",
}
