import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  tone?: "default" | "warning" | "danger" | "success"
}) {
  const toneClass = {
    default: "text-muted-foreground",
    warning: "text-chart-4",
    danger: "text-destructive",
    success: "text-chart-1",
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className={cn("text-xs", toneClass)}>{hint}</p> : null}
        </div>
        <div className={cn("rounded-lg bg-muted p-2.5", toneClass)}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
