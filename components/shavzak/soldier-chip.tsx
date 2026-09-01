"use client"

import { useDraggable } from "@dnd-kit/core"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { PlannerSoldier } from "./types"

export function SoldierChip({
  soldier,
  compact,
}: {
  soldier: PlannerSoldier
  compact?: boolean
}) {
  const tRanks = useTranslations("ranks")
  return (
    <div className={cn("flex flex-col text-start leading-tight", compact && "text-xs")}>
      <span className="truncate font-medium">{soldier.fullName}</span>
      <span className="truncate text-xs text-muted-foreground">
        {tRanks(soldier.rank as never)} · {soldier.role}
      </span>
    </div>
  )
}

/** Draggable soldier used in the pool. */
export function DraggableSoldier({ soldier }: { soldier: PlannerSoldier }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `soldier:${soldier.id}`,
    data: { soldierId: soldier.id },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card p-2 shadow-sm transition-colors hover:border-primary/50 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <SoldierChip soldier={soldier} compact />
    </div>
  )
}
