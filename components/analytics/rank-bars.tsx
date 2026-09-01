import { cn } from "@/lib/utils"

/** Simple horizontal bar list. Pure CSS, fully RTL-safe (no left/right). */
export function RankBars({
  items,
  barClass = "bg-chart-1",
}: {
  items: { name: string; count: number }[]
  barClass?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.name}</span>
            <span className="tabular-nums text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", barClass)}
              style={{ inlineSize: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
