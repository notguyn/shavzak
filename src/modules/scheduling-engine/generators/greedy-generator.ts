import { evaluateHard } from "../constraints"
import { scoreCandidate } from "../scoring/scoring-engine"
import type { CandidateContext, EngineAssignment, EngineSlot, SlotDecision } from "../types"
import type { AssignmentGenerator, GeneratorInput } from "./generator.interface"

const PRIORITY_RANK: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 }

/**
 * Greedy generator: fill the most constrained / highest-priority slots first,
 * picking the top-scoring eligible soldier for each. Deterministic for a given
 * input, which keeps explanations and tests stable.
 */
export const greedyGenerator: AssignmentGenerator = {
  name: "greedy",

  generate({ openSlots, assignmentsById, soldiers, rules, state, releaseDate }: GeneratorInput) {
    const decisions: SlotDecision[] = []

    // Order slots: priority desc, then difficulty desc, then earlier start first.
    const ordered = [...openSlots].sort((a, b) => {
      const aa = assignmentsById.get(a.assignmentId)!
      const ba = assignmentsById.get(b.assignmentId)!
      const pr = (PRIORITY_RANK[ba.priority] ?? 0) - (PRIORITY_RANK[aa.priority] ?? 0)
      if (pr !== 0) return pr
      const diff = ba.difficultyScore - aa.difficultyScore
      if (diff !== 0) return diff
      return new Date(aa.startAt).getTime() - new Date(ba.startAt).getTime()
    })

    const assignedSlotForAssignment = new Map<string, Set<string>>()

    for (const slot of ordered) {
      const assignment = assignmentsById.get(slot.assignmentId)
      if (!assignment) continue

      let best: { soldierId: string; score: number } | null = null

      for (const soldier of soldiers) {
        // A soldier cannot fill two slots of the same assignment instance.
        if (assignedSlotForAssignment.get(assignment.id)?.has(soldier.id)) continue

        const ctx: CandidateContext = {
          soldier,
          assignment,
          slot,
          soldierAssignments: state.assignmentsOf(soldier.id),
          workload: state.workload,
          releaseDate,
        }

        if (evaluateHard(ctx, rules).length > 0) continue

        const { totalScore } = scoreCandidate(ctx, rules)
        if (!best || totalScore > best.score) best = { soldierId: soldier.id, score: totalScore }
      }

      if (best) {
        state.assign(best.soldierId, assignment)
        const set = assignedSlotForAssignment.get(assignment.id) ?? new Set<string>()
        set.add(best.soldierId)
        assignedSlotForAssignment.set(assignment.id, set)
        decisions.push({ slotId: slot.id, soldierId: best.soldierId, score: best.score })
      } else {
        decisions.push({ slotId: slot.id, soldierId: null, score: null })
      }
    }

    return decisions
  },
}

export type { EngineAssignment, EngineSlot }
