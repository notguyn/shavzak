"use client"

import { useDroppable } from "@dnd-kit/core"
import { useTranslations } from "next-intl"
import { Lock, LockOpen, TriangleAlert, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SoldierChip } from "./soldier-chip"
import type { PlannerSoldier } from "./types"

export function SlotCell({
  slotId,
  soldier,
  isLocked,
  hasConflict,
  conflictKind,
  selected,
  onSelect,
  onClear,
  onToggleLock,
  readOnly,
}: {
  slotId: string
  soldier: PlannerSoldier | null
  isLocked: boolean
  hasConflict: boolean
  conflictKind?: string
  selected: boolean
  onSelect: () => void
  onClear: () => void
  onToggleLock: () => void
  readOnly: boolean
}) {
  const t = useTranslations("shavzak")
  const tConflict = useTranslations("conflictKinds")
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slotId}`, data: { slotId } })

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        "group relative flex min-h-12 items-center gap-2 rounded-md border border-dashed p-2 transition-colors",
        soldier ? "border-solid bg-card" : "bg-muted/30",
        isOver && "border-primary bg-primary/10",
        hasConflict && "border-destructive ring-1 ring-destructive/40",
        selected && "ring-2 ring-ring",
      )}
    >
      {hasConflict && (
        <div
          className="pointer-events-none absolute end-1 top-1 z-10"
          title={conflictKind ? tConflict(conflictKind as never) : undefined}
        >
          <TriangleAlert className="size-3 text-destructive" />
        </div>
      )}
      {soldier ? (
        <>
          <div className="min-w-0 flex-1">
            <SoldierChip soldier={soldier} compact />
          </div>
          {!readOnly && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label={isLocked ? t("unlockSlot") : t("lockSlot")}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock()
                }}
              >
                {isLocked ? (
                  <Lock className="size-3.5 text-chart-4" />
                ) : (
                  <LockOpen className="size-3.5 opacity-50 group-hover:opacity-100" />
                )}
              </Button>
              {!isLocked && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={t("clearSlot")}
                  onClick={(e) => {
                    e.stopPropagation()
                    onClear()
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <span className="text-xs text-muted-foreground">{t("dropHere")}</span>
      )}
    </div>
  )
}
