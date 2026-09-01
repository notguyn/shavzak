import { evaluateHard, type RuleLookup } from "../constraints"
import { scoreCandidate } from "../scoring/scoring-engine"
import { stateFromSlots, suggestReplacements } from "../conflict/conflict-analyzer"
import type {
  CandidateContext,
  EngineAssignment,
  EngineSlot,
  EngineSoldier,
  Explanation,
  ISODate,
} from "../types"

export interface ExplainInput {
  slotId: string
  slots: EngineSlot[]
  assignmentsById: ReadonlyMap<string, EngineAssignment>
  soldiers: EngineSoldier[]
  rules: RuleLookup
  releaseDate?: ISODate | null
}

/**
 * Explain a single slot: why its soldier scored as it did (soft breakdown),
 * which hard constraints (if any) it fails, and the best alternatives.
 */
export function explainSlot({
  slotId,
  slots,
  assignmentsById,
  soldiers,
  rules,
  releaseDate,
}: ExplainInput): Explanation {
  const slot = slots.find((s) => s.id === slotId)
  const assignment = slot ? assignmentsById.get(slot.assignmentId) : undefined

  if (!slot || !assignment) {
    return {
      slotId,
      soldierId: null,
      totalScore: 0,
      breakdown: [],
      failedConstraints: [],
      suggestedReplacements: [],
    }
  }

  // Build state excluding this slot so the soldier isn't double-counted.
  const others = slots.filter((s) => s.id !== slotId)
  const state = stateFromSlots(others, assignmentsById, soldiers)
  const soldier = slot.soldierId ? soldiers.find((s) => s.id === slot.soldierId) : undefined

  let totalScore = 0
  let breakdown: Explanation["breakdown"] = []
  let failedConstraints: string[] = []

  if (soldier) {
    const ctx: CandidateContext = {
      soldier,
      assignment,
      slot,
      soldierAssignments: state.assignmentsOf(soldier.id),
      workload: state.workload,
      releaseDate,
    }
    failedConstraints = evaluateHard(ctx, rules)
    const scored = scoreCandidate(ctx, rules)
    totalScore = scored.totalScore
    breakdown = scored.breakdown
  }

  return {
    slotId,
    soldierId: slot.soldierId ?? null,
    totalScore,
    breakdown,
    failedConstraints,
    suggestedReplacements: suggestReplacements(
      slot,
      assignment,
      soldiers,
      state,
      rules,
      releaseDate,
    ),
  }
}
