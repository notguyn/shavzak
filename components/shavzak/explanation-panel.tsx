"use client"

import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, CheckCircle, CheckCircle2, ChevronRight, Lightbulb, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/format"
import { useLocale } from "next-intl"
import { dir, type Locale } from "@/i18n/config"
import { Progress } from "@/components/ui/progress"
import type { Conflict, ConflictKind, Explanation, PlannerAssignment, PlannerSoldier } from "./types"

const KIND_ORDER: ConflictKind[] = ["UNFILLED", "OVERLAP", "REST", "CERT", "MEDICAL", "AVAILABILITY", "EQUIPMENT"]

const KIND_REASON_KEY: Record<ConflictKind, string> = {
  UNFILLED: "conflictReasonUNFILLED",
  OVERLAP: "conflictReasonOVERLAP",
  REST: "conflictReasonREST",
  CERT: "conflictReasonCERT",
  MEDICAL: "conflictReasonMEDICAL",
  AVAILABILITY: "conflictReasonAVAILABILITY",
  EQUIPMENT: "conflictReasonEQUIPMENT",
}

// ─── Conflict Summary ────────────────────────────────────────────────────────

function ConflictSummary({
  conflicts,
  assignmentById,
  soldierById,
  onSelectSlot,
}: {
  conflicts: Conflict[]
  assignmentById: Map<string, PlannerAssignment>
  soldierById: Map<string, PlannerSoldier>
  onSelectSlot?: (id: string | null) => void
}) {
  const t = useTranslations("shavzak")
  const tKind = useTranslations("conflictKinds")
  const locale = useLocale() as Locale

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <CheckCircle className="size-8 text-chart-1" />
        {t("noConflicts")}
      </div>
    )
  }

  // Group: kind → assignmentId → Conflict[]
  const byKind = new Map<ConflictKind, Map<string, Conflict[]>>()
  for (const k of KIND_ORDER) byKind.set(k, new Map())
  for (const c of conflicts) {
    const kindMap = byKind.get(c.kind)!
    const list = kindMap.get(c.assignmentId) ?? []
    list.push(c)
    kindMap.set(c.assignmentId, list)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b px-1 pb-2 pt-1">
        <p className="text-sm font-semibold">{t("conflictSummary")}</p>
        <p className="text-xs text-muted-foreground">{t("conflictsFound", { count: conflicts.length })}</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-3 px-1">
          {KIND_ORDER.filter((k) => (byKind.get(k)?.size ?? 0) > 0).map((kind) => {
            const kindMap = byKind.get(kind)!
            const kindTotal = [...kindMap.values()].reduce((n, list) => n + list.length, 0)
            return (
              <div key={kind} className="space-y-0.5">
                {/* Kind header */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <TriangleAlert className="size-3.5 shrink-0 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">{tKind(kind as never)}</span>
                  <span className="ms-auto rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive tabular-nums">
                    {kindTotal}
                  </span>
                </div>
                {/* Per-assignment rows */}
                {[...kindMap.entries()].map(([assignmentId, slotConflicts]) => {
                  const assignment = assignmentById.get(assignmentId)
                  const firstSlotId = slotConflicts[0].slotId
                  return (
                    <button
                      key={assignmentId}
                      type="button"
                      onClick={() => onSelectSlot?.(firstSlotId)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {assignment?.title ?? assignmentId}
                        </p>
                        {assignment && (
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {formatTime(assignment.startAt, locale)}–{formatTime(assignment.endAt, locale)}
                          </p>
                        )}
                      </div>
                      {slotConflicts.length > 1 && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                          ×{slotConflicts.length}
                        </span>
                      )}
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Conflict Detail ─────────────────────────────────────────────────────────

function ConflictDetail({
  explanation,
  conflict,
  assignment,
  soldierById,
  onBack,
}: {
  explanation: Explanation
  conflict: Conflict
  assignment?: PlannerAssignment
  soldierById: Map<string, PlannerSoldier>
  onBack?: () => void
}) {
  const t = useTranslations("shavzak")
  const tKind = useTranslations("conflictKinds")
  const tConstraints = useTranslations("constraintLabels")
  const locale = useLocale() as Locale
  const BackIcon = dir[locale] === "rtl" ? ArrowRight : ArrowLeft

  const soldier = explanation.soldierId ? soldierById.get(explanation.soldierId) : null
  const isUnfilled = conflict.kind === "UNFILLED"

  // Merge replacement suggestions: prefer conflict's (richer), fall back to explanation's
  const replacements =
    conflict.suggestedReplacements.length > 0
      ? conflict.suggestedReplacements
      : explanation.suggestedReplacements

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Back */}
      <div className="shrink-0 border-b pb-2 pt-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <BackIcon className="size-3" />
            {t("backToSummary")}
          </button>
        )}
        {assignment && (
          <div>
            <p className="truncate text-sm font-semibold">{assignment.title}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatTime(assignment.startAt, locale)}–{formatTime(assignment.endAt, locale)}
              {assignment.location ? ` · ${assignment.location}` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-2 px-1">
        {/* Conflict kind badge + reason */}
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <TriangleAlert className="size-4 shrink-0 text-destructive" />
            <span className="text-sm font-semibold text-destructive">{tKind(conflict.kind as never)}</span>
          </div>
          <p className="text-xs text-destructive/80">{t(KIND_REASON_KEY[conflict.kind] as never)}</p>
          {soldier && (
            <p className="text-xs font-medium text-foreground">
              {soldier.fullName}
            </p>
          )}
        </div>

        {/* Failed hard constraints */}
        {explanation.failedConstraints.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("failedConstraints")}
            </p>
            <ul className="space-y-0.5">
              {explanation.failedConstraints.map((key) => (
                <li key={key} className="flex items-start gap-1.5 text-xs text-destructive">
                  <span className="mt-0.5 shrink-0">✗</span>
                  {tConstraints(key as never)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Soft score breakdown (only if soldier was assigned) */}
        {soldier && explanation.breakdown.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <CheckCircle2 className="size-3.5 text-chart-1" />
              {t("whySelected")}
            </p>
            <div className="space-y-1.5">
              {explanation.breakdown.map((b) => (
                <div key={b.key} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tConstraints(b.key as never)}</span>
                    <span className="tabular-nums text-muted-foreground">{Math.round(b.score * 100)}%</span>
                  </div>
                  <Progress value={b.score * 100} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested replacements */}
        {replacements.length > 0 ? (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Lightbulb className="size-3.5 text-chart-2" />
              {t("suggestedReplacements")}
            </p>
            <ul className="space-y-1">
              {replacements.map((r, i) => (
                <li
                  key={r.soldierId}
                  className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-muted-foreground">#{i + 1}</span>
                    <span className="font-medium">
                      {soldierById.get(r.soldierId)?.fullName ?? r.soldierId}
                    </span>
                  </div>
                  <span className="tabular-nums text-muted-foreground">{Math.round(r.score * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : isUnfilled ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t("conflictReasonUNFILLED")}
          </p>
        ) : null}
      </div>
    </div>
  )
}

// ─── ExplanationPanel ────────────────────────────────────────────────────────

export function ExplanationPanel({
  explanation,
  selectedConflict,
  selectedAssignment,
  conflicts,
  assignmentById,
  soldierById,
  onSelectSlot,
}: {
  explanation: Explanation | null
  selectedConflict?: Conflict
  selectedAssignment?: PlannerAssignment
  conflicts?: Conflict[]
  assignmentById?: Map<string, PlannerAssignment>
  soldierById: Map<string, PlannerSoldier>
  onSelectSlot?: (id: string | null) => void
}) {
  const t = useTranslations("shavzak")
  const tConstraints = useTranslations("constraintLabels")
  const locale = useLocale() as Locale
  const BackIcon = dir[locale] === "rtl" ? ArrowRight : ArrowLeft

  // Slot selected AND it has a conflict — show ConflictDetail
  if (explanation && selectedConflict) {
    return (
      <ConflictDetail
        explanation={explanation}
        conflict={selectedConflict}
        assignment={selectedAssignment}
        soldierById={soldierById}
        onBack={() => onSelectSlot?.(null)}
      />
    )
  }

  // Slot selected, no conflict — show normal explanation
  if (explanation) {
    const soldier = explanation.soldierId ? soldierById.get(explanation.soldierId) : null
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b pb-2 pt-1">
          {onSelectSlot && conflicts && conflicts.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectSlot(null)}
              className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <BackIcon className="size-3" />
              {t("backToSummary")}
            </button>
          )}
          <p className="text-sm font-semibold">{t("explanation")}</p>
          {selectedAssignment && (
            <p className="truncate text-xs text-muted-foreground">
              {selectedAssignment.title} · {formatTime(selectedAssignment.startAt, locale)}–{formatTime(selectedAssignment.endAt, locale)}
            </p>
          )}
          {soldier && <p className="text-xs text-muted-foreground">{soldier.fullName}</p>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-2 px-1">
          {explanation.failedConstraints.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <TriangleAlert className="size-3.5" />
                {t("failedConstraints")}
              </p>
              <ul className="space-y-0.5 text-xs">
                {explanation.failedConstraints.map((key) => (
                  <li key={key} className="text-destructive">• {tConstraints(key as never)}</li>
                ))}
              </ul>
            </div>
          )}

          {soldier && explanation.breakdown.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <CheckCircle2 className="size-3.5 text-chart-1" />
                {t("whySelected")}
              </p>
              <div className="space-y-1.5">
                {explanation.breakdown.map((b) => (
                  <div key={b.key} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tConstraints(b.key as never)}</span>
                      <span className="tabular-nums text-muted-foreground">{Math.round(b.score * 100)}%</span>
                    </div>
                    <Progress value={b.score * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {explanation.suggestedReplacements.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Lightbulb className="size-3.5 text-chart-2" />
                {t("suggestedReplacements")}
              </p>
              <ul className="space-y-1">
                {explanation.suggestedReplacements.map((r, i) => (
                  <li
                    key={r.soldierId}
                    className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-muted-foreground">#{i + 1}</span>
                      <span className="font-medium">
                        {soldierById.get(r.soldierId)?.fullName ?? r.soldierId}
                      </span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">{Math.round(r.score * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!soldier && explanation.failedConstraints.length === 0 && explanation.suggestedReplacements.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("noExplanation")}</p>
          )}
        </div>
      </div>
    )
  }

  // Nothing selected — show conflict summary or empty state
  if (conflicts && assignmentById) {
    return (
      <ConflictSummary
        conflicts={conflicts}
        assignmentById={assignmentById}
        soldierById={soldierById}
        onSelectSlot={onSelectSlot}
      />
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {t("noExplanation")}
    </div>
  )
}
