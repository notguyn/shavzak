// Public API of the scheduling engine. UI/services import only from here.

export { generateSchedule, type EngineStrategies } from "./engine"
export { analyzeConflicts } from "./conflict/conflict-analyzer"
export { explainSlot } from "./explain/explainer"
export { greedyGenerator } from "./generators/greedy-generator"
export type { AssignmentGenerator, GeneratorInput } from "./generators/generator.interface"
export { noopOptimizer } from "./optimization/noop-optimizer"
export type { Optimizer, OptimizerInput } from "./optimization/optimizer.interface"
export { DEFAULT_WEIGHTS } from "./scoring/weights"
export { HARD_CONSTRAINTS, SOFT_CONSTRAINTS } from "./constraints"

export type {
  CandidateContext,
  Conflict,
  ConflictKind,
  ConstraintKind,
  ConstraintRuleConfig,
  EngineAssignment,
  EngineSlot,
  EngineSoldier,
  Explanation,
  PriorityLevel,
  ReplacementSuggestion,
  ScheduleContext,
  ScheduleMode,
  ScheduleResult,
  SlotDecision,
  SoftBreakdown,
  TimeWindow,
} from "./types"
