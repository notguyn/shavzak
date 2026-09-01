"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Redo2, Sparkles, TriangleAlert, Undo2, Wand2 } from "lucide-react"

import { formatDate } from "@/lib/format"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { applyAssignmentsAction, generateScheduleAction } from "@/modules/shavzak/actions"
import { generateSchedule, type PriorityLevel, type ScheduleContext } from "@/modules/scheduling-engine"
import type { Locale } from "@/i18n/config"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentCard } from "./assignment-card"
import { ExplanationPanel } from "./explanation-panel"
import { SoldierChip } from "./soldier-chip"
import { SoldierPool } from "./soldier-pool"
import type { Conflict, Explanation, PlannerData, SlotState } from "./types"

function initialState(data: PlannerData): SlotState {
  const state: SlotState = {}
  for (const s of data.slots) {
    state[s.id] = {
      soldierId: s.soldierId,
      isLocked: s.isLocked,
      status: s.status,
      score: s.score,
    }
  }
  return state
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export function Planner({ data, canWrite }: { data: PlannerData; canWrite: boolean }) {
  const t = useTranslations("shavzak")
  const tc = useTranslations("common")
  const locale = useLocale() as Locale
  const [, startTransition] = React.useTransition()

  const soldierById = React.useMemo(
    () => new Map(data.soldiers.map((s) => [s.id, s])),
    [data.soldiers],
  )

  const assignmentById = React.useMemo(
    () => new Map(data.assignments.map((a) => [a.id, a])),
    [data.assignments],
  )

  const [history, setHistory] = React.useState<SlotState[]>(() => [initialState(data)])
  const [cursor, setCursor] = React.useState(0)
  const slotState = history[cursor]

  const [explanations, setExplanations] = React.useState<Record<string, Explanation>>({})
  const [conflicts, setConflicts] = React.useState<Conflict[]>([])
  const [selectedSlotId, setSelectedSlotId] = React.useState<string | null>(null)

  const conflictsById = React.useMemo(
    () => new Map(conflicts.map((c) => [c.slotId, c])),
    [conflicts],
  )

  const selectedConflict = selectedSlotId ? conflictsById.get(selectedSlotId) : undefined

  const selectedAssignment = React.useMemo(() => {
    if (!selectedSlotId) return undefined
    const slot = data.slots.find((s) => s.id === selectedSlotId)
    return slot ? assignmentById.get(slot.assignmentId) : undefined
  }, [selectedSlotId, data.slots, assignmentById])

  const [activeSoldierId, setActiveSoldierId] = React.useState<string | null>(null)
  const [platoon, setPlatoon] = React.useState<string>("all")
  const [view, setView] = React.useState<"week" | "day">("week")
  const [activeDay, setActiveDay] = React.useState<string>(dayKey(data.board.startDate))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Days spanned by the board.
  const days = React.useMemo(() => {
    const out: string[] = []
    const start = new Date(data.board.startDate)
    const end = new Date(data.board.endDate)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10))
    }
    return out
  }, [data.board.startDate, data.board.endDate])

  const slotsByAssignment = React.useMemo(() => {
    const map = new Map<string, typeof data.slots>()
    for (const s of data.slots) {
      const list = map.get(s.assignmentId) ?? []
      list.push(s)
      map.set(s.assignmentId, list)
    }
    return map
  }, [data.slots])

  const assignedCount = React.useMemo(() => {
    const count = new Map<string, number>()
    for (const v of Object.values(slotState)) {
      if (v.soldierId) count.set(v.soldierId, (count.get(v.soldierId) ?? 0) + 1)
    }
    return count
  }, [slotState])

  const pool = React.useMemo(
    () => (platoon === "all" ? data.soldiers : data.soldiers.filter((s) => s.platoonId === platoon)),
    [data.soldiers, platoon],
  )

  function persist(next: SlotState) {
    if (!canWrite) return
    // Preview mode: local state (via commit()) is the only source of truth —
    // there is nothing to send to the server.
    if (PREVIEW_MODE) return
    const items = Object.entries(next).map(([slotId, v]) => ({
      slotId,
      soldierId: v.soldierId,
      isLocked: v.isLocked,
    }))
    startTransition(() => {
      void applyAssignmentsAction(items)
    })
  }

  function commit(next: SlotState, options?: { persist?: boolean }) {
    const trimmed = history.slice(0, cursor + 1)
    setHistory([...trimmed, next])
    setCursor(trimmed.length)
    if (options?.persist !== false) persist(next)
  }

  function assignSoldier(slotId: string, soldierId: string) {
    if (!canWrite || slotState[slotId]?.isLocked) return

    const slot = data.slots.find((s) => s.id === slotId)
    const assignment = slot ? assignmentById.get(slot.assignmentId) : undefined
    const soldier = soldierById.get(soldierId)

    if (assignment?.requiresVehicle && soldier && !soldier.hasDrivingLicense) {
      const siblingSlots = (slotsByAssignment.get(assignment.id) ?? []).filter((s) => s.id !== slotId)
      const hasLicensedDriver = siblingSlots.some((s) => {
        const sid = slotState[s.id]?.soldierId
        return sid ? soldierById.get(sid)?.hasDrivingLicense : false
      })
      if (!hasLicensedDriver) {
        toast.error(t("noDrivingLicense"))
        return
      }
    }

    const next: SlotState = {
      ...slotState,
      [slotId]: { ...slotState[slotId], soldierId, status: "FILLED" },
    }
    commit(next)
  }

  function clearSlot(slotId: string) {
    if (!canWrite) return

    const slot = data.slots.find((s) => s.id === slotId)
    const assignment = slot ? assignmentById.get(slot.assignmentId) : undefined
    const currentSoldierId = slotState[slotId]?.soldierId
    const currentSoldier = currentSoldierId ? soldierById.get(currentSoldierId) : undefined

    if (assignment?.requiresVehicle && currentSoldier?.hasDrivingLicense) {
      const siblingSlots = (slotsByAssignment.get(assignment.id) ?? []).filter((s) => s.id !== slotId)
      const otherLicensedDriver = siblingSlots.some((s) => {
        const sid = slotState[s.id]?.soldierId
        return sid ? soldierById.get(sid)?.hasDrivingLicense : false
      })
      if (!otherLicensedDriver) {
        toast.error(t("noDrivingLicense"))
        return
      }
    }

    const next: SlotState = {
      ...slotState,
      [slotId]: { ...slotState[slotId], soldierId: null, status: "EMPTY" },
    }
    commit(next)
  }

  function toggleLock(slotId: string) {
    if (!canWrite) return
    const cur = slotState[slotId]
    const next: SlotState = {
      ...slotState,
      [slotId]: { ...cur, isLocked: !cur.isLocked },
    }
    commit(next)
  }

  function undo() {
    if (cursor === 0) return
    const idx = cursor - 1
    setCursor(idx)
    persist(history[idx])
  }

  function redo() {
    if (cursor >= history.length - 1) return
    const idx = cursor + 1
    setCursor(idx)
    persist(history[idx])
  }

  function generate(mode: "SEMI" | "FULL") {
    if (PREVIEW_MODE) {
      const ctx: ScheduleContext = {
        assignments: data.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          startAt: a.startAt,
          endAt: a.endAt,
          requiredManpower: a.requiredManpower,
          requiredRole: a.requiredRole,
          requiredCertificationCodes: a.requiredCertificationCodes,
          priority: a.priority as PriorityLevel,
          requiresWeapon: a.requiresWeapon,
          requiresVehicle: a.requiresVehicle,
          difficultyScore: a.difficultyScore,
        })),
        slots: data.slots.map((s) => ({
          id: s.id,
          assignmentId: s.assignmentId,
          soldierId: slotState[s.id]?.soldierId ?? null,
          isLocked: slotState[s.id]?.isLocked ?? false,
          isManual: s.isManual,
        })),
        soldiers: data.soldiers.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          platoonId: s.platoonId,
          rank: s.rank,
          role: s.role,
          travelDistanceKm: s.travelDistanceKm,
          certificationCodes: s.certificationCodes,
          hasDrivingLicense: s.hasDrivingLicense,
          medicalLimitations: s.medicalLimitations,
          preferredShifts: s.preferredShifts,
          blockedShifts: s.blockedShifts,
          maxConsecutiveDuties: s.maxConsecutiveDuties,
          availability: s.availability,
          lastAssignmentDate: s.lastAssignmentDate,
        })),
        rules: data.rules,
        mode,
        releaseDate: data.board.endDate,
        now: new Date().toISOString(),
      }
      const result = generateSchedule(ctx)
      const next: SlotState = { ...slotState }
      for (const d of result.decisions) {
        next[d.slotId] = {
          ...next[d.slotId],
          soldierId: d.soldierId,
          score: d.score,
          status: d.soldierId ? "FILLED" : "EMPTY",
        }
      }
      setExplanations(Object.fromEntries(result.explanations.map((e) => [e.slotId, e])))
      setConflicts(result.conflicts)
      setSelectedSlotId(null)
      commit(next, { persist: false })
      toast.success(
        `${t("generated")} · ${t("conflictsFound", { count: result.stats.conflictCount })}`,
      )
      return
    }
    startTransition(async () => {
      const res = await generateScheduleAction(data.board.id, mode)
      if (!res.ok) {
        toast.error(tc("error"))
        return
      }
      const next: SlotState = { ...slotState }
      for (const d of res.result.decisions) {
        next[d.slotId] = {
          ...next[d.slotId],
          soldierId: d.soldierId,
          score: d.score,
          status: d.soldierId ? "FILLED" : "EMPTY",
        }
      }
      setExplanations(Object.fromEntries(res.result.explanations.map((e) => [e.slotId, e])))
      setConflicts(res.result.conflicts)
      setSelectedSlotId(null)
      commit(next, { persist: false }) // action already persisted
      toast.success(
        `${t("generated")} · ${t("conflictsFound", { count: res.result.stats.conflictCount })}`,
      )
    })
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id)
    if (id.startsWith("soldier:")) setActiveSoldierId(id.slice("soldier:".length))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveSoldierId(null)
    const overId = e.over ? String(e.over.id) : null
    const soldierId = e.active.data.current?.soldierId as string | undefined
    if (overId?.startsWith("slot:") && soldierId) {
      assignSoldier(overId.slice("slot:".length), soldierId)
    }
  }

  const visibleDays = view === "day" ? [activeDay] : days
  const activeSoldier = activeSoldierId ? soldierById.get(activeSoldierId) : null

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "day")}>
            <TabsList>
              <TabsTrigger value="week">{t("weeklyView")}</TabsTrigger>
              <TabsTrigger value="day">{t("dailyView")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={platoon} onValueChange={(v) => setPlatoon(v ?? "all")}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue>
                {platoon === "all"
                  ? t("battalionView")
                  : data.soldiers.find((s) => s.platoonId === platoon)?.platoonName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("battalionView")}</SelectItem>
              {[...new Map(data.soldiers.filter((s) => s.platoonId).map((s) => [s.platoonId!, s.platoonName])).entries()].map(
                ([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <div className="ms-auto flex items-center gap-2">
            {conflicts.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSlotId(null)}
                className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                title={t("conflictSummary")}
              >
                <TriangleAlert className="size-3.5" />
                {t("conflictsFound", { count: conflicts.length })}
              </button>
            )}
            <Button variant="outline" size="icon" onClick={undo} disabled={cursor === 0} aria-label={tc("undo")}>
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={cursor >= history.length - 1}
              aria-label={tc("redo")}
            >
              <Redo2 className="size-4" />
            </Button>
            {canWrite && (
              <>
                <Button variant="outline" onClick={() => generate("SEMI")} className="gap-2">
                  <Wand2 className="size-4" />
                  {t("generateSemi")}
                </Button>
                <Button onClick={() => generate("FULL")} className="gap-2">
                  <Sparkles className="size-4" />
                  {t("generateFull")}
                </Button>
              </>
            )}
          </div>
        </div>

        {view === "day" && (
          <Tabs value={activeDay} onValueChange={setActiveDay}>
            <TabsList className="flex-wrap">
              {days.map((d) => (
                <TabsTrigger key={d} value={d}>
                  {formatDate(d, locale, { weekday: "short", day: "2-digit", month: "2-digit" })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="grid gap-4 lg:grid-cols-[18rem_1fr_18rem]">
          {/* Soldier pool */}
          <Card className="p-3">
            <SoldierPool soldiers={pool} assignedCount={assignedCount} />
          </Card>

          {/* Board */}
          <div className="min-w-0 space-y-3 overflow-x-auto">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(15rem, 1fr))` }}
            >
              {visibleDays.map((day) => {
                const dayAssignments = data.assignments.filter((a) => dayKey(a.startAt) === day)
                return (
                  <div key={day} className="space-y-2">
                    <p className="sticky top-0 rounded-md bg-muted/60 px-2 py-1 text-center text-xs font-medium backdrop-blur">
                      {formatDate(day, locale, { weekday: "long", day: "2-digit", month: "2-digit" })}
                    </p>
                    {dayAssignments.length ? (
                      dayAssignments.map((a) => {
                        const slots = (slotsByAssignment.get(a.id) ?? []).map((s) => ({
                          ...s,
                          soldierId: slotState[s.id]?.soldierId ?? null,
                          isLocked: slotState[s.id]?.isLocked ?? false,
                          status: slotState[s.id]?.status ?? "EMPTY",
                        }))
                        return (
                          <AssignmentCard
                            key={a.id}
                            assignment={a}
                            slots={slots}
                            soldierById={soldierById}
                            conflictsById={conflictsById}
                            selectedSlotId={selectedSlotId}
                            onSelectSlot={setSelectedSlotId}
                            onClearSlot={clearSlot}
                            onToggleLock={toggleLock}
                            readOnly={!canWrite}
                          />
                        )
                      })
                    ) : (
                      <p className="px-2 text-xs text-muted-foreground">{tc("noResults")}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Explanation / Conflict Summary */}
          <Card className="p-3 overflow-hidden">
            <ExplanationPanel
              explanation={selectedSlotId ? explanations[selectedSlotId] ?? null : null}
              selectedConflict={selectedConflict}
              selectedAssignment={selectedAssignment}
              conflicts={conflicts}
              assignmentById={assignmentById}
              soldierById={soldierById}
              onSelectSlot={(id) => setSelectedSlotId(id)}
            />
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeSoldier ? (
          <div className="rounded-lg border bg-card p-2 shadow-lg">
            <SoldierChip soldier={activeSoldier} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
