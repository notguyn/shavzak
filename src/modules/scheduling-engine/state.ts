import type { EngineAssignment } from "./types"

/**
 * Mutable working state during generation: tracks which assignments each soldier
 * already holds and their workload count, so constraints see the evolving schedule.
 */
export class ScheduleState {
  private readonly bySoldier = new Map<string, EngineAssignment[]>()
  private readonly load = new Map<string, number>()

  constructor(soldierIds: string[]) {
    for (const id of soldierIds) {
      this.bySoldier.set(id, [])
      this.load.set(id, 0)
    }
  }

  assign(soldierId: string, assignment: EngineAssignment): void {
    const list = this.bySoldier.get(soldierId) ?? []
    list.push(assignment)
    this.bySoldier.set(soldierId, list)
    this.load.set(soldierId, (this.load.get(soldierId) ?? 0) + 1)
  }

  assignmentsOf(soldierId: string): EngineAssignment[] {
    return this.bySoldier.get(soldierId) ?? []
  }

  get workload(): ReadonlyMap<string, number> {
    return this.load
  }
}
