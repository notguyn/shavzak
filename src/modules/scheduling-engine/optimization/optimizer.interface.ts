import type { RuleLookup } from "../constraints"
import type { EngineAssignment, EngineSoldier, ISODate, SlotDecision } from "../types"

export interface OptimizerInput {
  decisions: SlotDecision[]
  assignmentsById: ReadonlyMap<string, EngineAssignment>
  soldiers: EngineSoldier[]
  rules: RuleLookup
  releaseDate?: ISODate | null
}

/**
 * Post-generation improvement pass. v1 ships a no-op; future strategies
 * (hill-climbing, simulated annealing, ILP refinement) implement this interface
 * to rebalance fairness without touching the generator or the UI.
 */
export interface Optimizer {
  readonly name: string
  optimize(input: OptimizerInput): SlotDecision[]
}
