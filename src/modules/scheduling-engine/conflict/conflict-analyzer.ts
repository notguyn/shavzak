import { evaluateHard, type RuleLookup } from "../constraints"
import { scoreCandidate } from "../scoring/scoring-engine"
import { ScheduleState } from "../state"
import type {
  CandidateContext,
  Conflict,
  ConflictKind,
  EngineAssignment,
  EngineSlot,
  EngineSoldier,
  ISODate,
  ReplacementSuggestion,
} from "../types"

const REASON_TO_KIND: Record<string, ConflictKind> = {
  "no-overlap": "OVERLAP",
  "rest-time": "REST",
  "max-consecutive": "REST",
  certification: "CERT",
  medical: "MEDICAL",
  availability: "AVAILABILITY",
  equipment: "EQUIPMENT",
  locked: "OVERLAP",
}

export interface AnalyzerInput {
  /** Slots carrying their final resolved soldierId. */
  slots: EngineSlot[]
  assignmentsById: ReadonlyMap<string, EngineAssignment>
  soldiers: EngineSoldier[]
  rules: RuleLookup
  releaseDate?: ISODate | null
}

/** Rebuild the full working state from already-resolved slots. */
export function stateFromSlots(
  slots: EngineSlot[],
  assignmentsById: ReadonlyMap<string, EngineAssignment>,
  soldiers: EngineSoldier[],
): ScheduleState {
  const state = new ScheduleState(soldiers.map((s) => s.id))
  for (const slot of slots) {
    if (!slot.soldierId) continue
    const a = assignmentsById.get(slot.assignmentId)
    if (a) state.assign(slot.soldierId, a)
  }
  return state
}

/** Top-N eligible alternatives for a slot, excluding the current occupant. */
export function suggestReplacements(
  slot: EngineSlot,
  assignment: EngineAssignment,
  soldiers: EngineSoldier[],
  state: ScheduleState,
  rules: RuleLookup,
  releaseDate?: ISODate | null,
  limit = 3,
): ReplacementSuggestion[] {
  const out: ReplacementSuggestion[] = []
  for (const soldier of soldiers) {
    if (soldier.id === slot.soldierId) continue
    const ctx: CandidateContext = {
      soldier,
      assignment,
      slot,
      soldierAssignments: state.assignmentsOf(soldier.id),
      workload: state.workload,
      releaseDate,
    }
    if (evaluateHard(ctx, rules).length > 0) continue
    out.push({ soldierId: soldier.id, score: scoreCandidate(ctx, rules).totalScore })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Classify every problematic slot: unfilled slots and slots whose occupant
 * violates a hard constraint. Each conflict carries suggested replacements.
 */
export function analyzeConflicts({
  slots,
  assignmentsById,
  soldiers,
  rules,
  releaseDate,
}: AnalyzerInput): Conflict[] {
  const state = stateFromSlots(slots, assignmentsById, soldiers)
  const soldierById = new Map(soldiers.map((s) => [s.id, s]))
  const conflicts: Conflict[] = []

  for (const slot of slots) {
    const assignment = assignmentsById.get(slot.assignmentId)
    if (!assignment) continue

    if (!slot.soldierId) {
      conflicts.push({
        slotId: slot.id,
        assignmentId: assignment.id,
        kind: "UNFILLED",
        soldierId: null,
        detail: `No eligible soldier for "${assignment.title}"`,
        suggestedReplacements: suggestReplacements(
          slot,
          assignment,
          soldiers,
          state,
          rules,
          releaseDate,
        ),
      })
      continue
    }

    const soldier = soldierById.get(slot.soldierId)
    if (!soldier) continue

    const ctx: CandidateContext = {
      soldier,
      assignment,
      slot,
      soldierAssignments: state.assignmentsOf(soldier.id),
      workload: state.workload,
      releaseDate,
    }
    const failed = evaluateHard(ctx, rules)
    if (failed.length > 0) {
      conflicts.push({
        slotId: slot.id,
        assignmentId: assignment.id,
        kind: REASON_TO_KIND[failed[0]] ?? "OVERLAP",
        soldierId: soldier.id,
        detail: `${soldier.fullName}: ${failed.join(", ")}`,
        suggestedReplacements: suggestReplacements(
          slot,
          assignment,
          soldiers,
          state,
          rules,
          releaseDate,
        ),
      })
    }
  }

  return conflicts
}
