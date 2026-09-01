"use client"

import { useLocale, useTranslations } from "next-intl"

import { formatTime } from "@/lib/format"
import { typeColor, PRIORITY_COLORS } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import { Badge } from "@/components/ui/badge"
import { SlotCell } from "./slot-cell"
import type { Conflict, PlannerAssignment, PlannerSlot, PlannerSoldier } from "./types"

export function AssignmentCard({
  assignment,
  slots,
  soldierById,
  conflictsById,
  selectedSlotId,
  onSelectSlot,
  onClearSlot,
  onToggleLock,
  readOnly,
}: {
  assignment: PlannerAssignment
  slots: PlannerSlot[]
  soldierById: Map<string, PlannerSoldier>
  conflictsById: Map<string, Conflict>
  selectedSlotId: string | null
  onSelectSlot: (id: string) => void
  onClearSlot: (id: string) => void
  onToggleLock: (id: string) => void
  readOnly: boolean
}) {
  const locale = useLocale() as Locale
  const tType = useTranslations("assignmentTypes")
  const tPriority = useTranslations("priority")
  const color = typeColor(assignment.type)

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-stretch">
        <div className={cn("w-1 shrink-0", color.bar)} />
        <div className="flex-1 space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{assignment.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(assignment.startAt, locale)}–{formatTime(assignment.endAt, locale)}
                {assignment.location ? ` · ${assignment.location}` : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={cn("text-xs", color.badge)}>
                {tType(assignment.type as never)}
              </Badge>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px]", PRIORITY_COLORS[assignment.priority])}>
                {tPriority(assignment.priority as never)}
              </span>
            </div>
          </div>

          <div className="grid gap-1.5">
            {slots.map((slot) => (
              <SlotCell
                key={slot.id}
                slotId={slot.id}
                soldier={slot.soldierId ? soldierById.get(slot.soldierId) ?? null : null}
                isLocked={slot.isLocked}
                hasConflict={conflictsById.has(slot.id)}
                conflictKind={conflictsById.get(slot.id)?.kind}
                selected={selectedSlotId === slot.id}
                onSelect={() => onSelectSlot(slot.id)}
                onClear={() => onClearSlot(slot.id)}
                onToggleLock={() => onToggleLock(slot.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
