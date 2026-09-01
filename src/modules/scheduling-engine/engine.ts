import { analyzeConflicts } from "./conflict/conflict-analyzer"
import { buildRuleLookup } from "./constraints"
import { explainSlot } from "./explain/explainer"
import { greedyGenerator } from "./generators/greedy-generator"
import type { AssignmentGenerator } from "./generators/generator.interface"
import { noopOptimizer } from "./optimization/noop-optimizer"
import type { Optimizer } from "./optimization/optimizer.interface"
import { ScheduleState } from "./state"
import type { EngineSlot, ScheduleContext, ScheduleResult, SlotDecision } from "./types"

export interface EngineStrategies {
  generator?: AssignmentGenerator
  optimizer?: Optimizer
}

/**
 * Orchestrates the pipeline: hard filter -> soft scoring -> generate -> optimise
 * -> analyse -> explain. Strategies are injectable so new algorithms slot in
 * without changing callers.
 */
export function generateSchedule(
  ctx: ScheduleContext,
  strategies: EngineStrategies = {},
): ScheduleResult {
  const generator = strategies.generator ?? greedyGenerator
  const optimizer = strategies.optimizer ?? noopOptimizer

  const assignmentsById = new Map(ctx.assignments.map((a) => [a.id, a]))
  const rules = buildRuleLookup(ctx.rules)

  // Partition slots by mode. FULL regenerates everything except locked slots;
  // SEMI keeps anything already filled and fills only the empties.
  const fixed: EngineSlot[] = []
  const open: EngineSlot[] = []
  for (const slot of ctx.slots) {
    const keep = ctx.mode === "FULL" ? slot.isLocked && !!slot.soldierId : !!slot.soldierId
    if (keep) fixed.push(slot)
    else open.push({ ...slot, soldierId: null })
  }

  // Seed state with the fixed assignments so constraints respect them.
  const state = new ScheduleState(ctx.soldiers.map((s) => s.id))
  for (const slot of fixed) {
    const a = assignmentsById.get(slot.assignmentId)
    if (slot.soldierId && a) state.assign(slot.soldierId, a)
  }

  const generated = generator.generate({
    openSlots: open,
    assignmentsById,
    soldiers: ctx.soldiers,
    rules,
    state,
    releaseDate: ctx.releaseDate,
  })

  const optimized = optimizer.optimize({
    decisions: generated,
    assignmentsById,
    soldiers: ctx.soldiers,
    rules,
    releaseDate: ctx.releaseDate,
  })

  // Merge fixed + (optimised) generated into the full decision set.
  const fixedDecisions: SlotDecision[] = fixed.map((s) => ({
    slotId: s.id,
    soldierId: s.soldierId ?? null,
    score: null,
  }))
  const decisions = [...fixedDecisions, ...optimized]

  // Resolved slots (with final soldierId) for analysis + explanations.
  const decisionBySlot = new Map(decisions.map((d) => [d.slotId, d]))
  const resolvedSlots: EngineSlot[] = ctx.slots.map((s) => ({
    ...s,
    soldierId: decisionBySlot.get(s.id)?.soldierId ?? null,
  }))

  const conflicts = analyzeConflicts({
    slots: resolvedSlots,
    assignmentsById,
    soldiers: ctx.soldiers,
    rules,
    releaseDate: ctx.releaseDate,
  })

  const explanations = resolvedSlots.map((s) =>
    explainSlot({
      slotId: s.id,
      slots: resolvedSlots,
      assignmentsById,
      soldiers: ctx.soldiers,
      rules,
      releaseDate: ctx.releaseDate,
    }),
  )

  const filledSlots = resolvedSlots.filter((s) => s.soldierId).length
  return {
    decisions,
    conflicts,
    explanations,
    stats: {
      totalSlots: resolvedSlots.length,
      filledSlots,
      unfilledSlots: resolvedSlots.length - filledSlots,
      conflictCount: conflicts.length,
    },
  }
}
