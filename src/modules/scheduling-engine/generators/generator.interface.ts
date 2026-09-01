import type { RuleLookup } from "../constraints"
import type { ScheduleState } from "../state"
import type { EngineAssignment, EngineSlot, EngineSoldier, ISODate, SlotDecision } from "../types"

export interface GeneratorInput {
  /** Empty, non-locked slots the generator must try to fill. */
  openSlots: EngineSlot[]
  assignmentsById: ReadonlyMap<string, EngineAssignment>
  soldiers: EngineSoldier[]
  rules: RuleLookup
  /** Pre-seeded with locked/manual assignments already in place. */
  state: ScheduleState
  releaseDate?: ISODate | null
}

/**
 * Strategy contract for filling open slots. Implementations must be pure w.r.t.
 * their inputs aside from mutating the provided `state`. Future optimisers
 * (simulated annealing, ILP) implement this same interface and drop in unchanged.
 */
export interface AssignmentGenerator {
  readonly name: string
  generate(input: GeneratorInput): SlotDecision[]
}
