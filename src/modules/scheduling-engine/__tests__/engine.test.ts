import { describe, expect, it } from "bun:test"

import { buildRuleLookup, evaluateHard } from "../constraints"
import { generateSchedule } from "../engine"
import type {
  ConstraintRuleConfig,
  EngineAssignment,
  EngineSlot,
  EngineSoldier,
  ScheduleContext,
} from "../types"

const rules: ConstraintRuleConfig[] = [
  { key: "no-overlap", kind: "HARD", enabled: true, weight: 0 },
  { key: "rest-time", kind: "HARD", enabled: true, weight: 0, params: { minRestHours: 8 } },
  { key: "certification", kind: "HARD", enabled: true, weight: 0 },
  { key: "medical", kind: "HARD", enabled: true, weight: 0 },
  { key: "availability", kind: "HARD", enabled: true, weight: 0 },
  { key: "locked", kind: "HARD", enabled: true, weight: 0 },
  { key: "equipment", kind: "HARD", enabled: true, weight: 0 },
  { key: "max-consecutive", kind: "HARD", enabled: true, weight: 0 },
  { key: "workload-balance", kind: "SOFT", enabled: true, weight: 3 },
  { key: "anti-repetition", kind: "SOFT", enabled: true, weight: 2 },
  { key: "shift-preference", kind: "SOFT", enabled: true, weight: 1 },
  { key: "qualification-preference", kind: "SOFT", enabled: true, weight: 1.5 },
]

function soldier(id: string, over: Partial<EngineSoldier> = {}): EngineSoldier {
  return {
    id,
    fullName: id,
    rank: "PRIVATE",
    role: "לוחם",
    travelDistanceKm: 50,
    certificationCodes: [],
    hasDrivingLicense: true,
    medicalLimitations: [],
    preferredShifts: [],
    blockedShifts: [],
    maxConsecutiveDuties: 5,
    ...over,
  }
}

function assignment(id: string, over: Partial<EngineAssignment> = {}): EngineAssignment {
  return {
    id,
    title: id,
    type: "MISSION",
    startAt: "2026-06-01T08:00:00.000Z",
    endAt: "2026-06-01T14:00:00.000Z",
    requiredManpower: 1,
    requiredCertificationCodes: [],
    priority: "MEDIUM",
    requiresWeapon: false,
    requiresVehicle: false,
    difficultyScore: 1,
    ...over,
  }
}

describe("hard constraints", () => {
  it("rejects overlapping assignments for the same soldier", () => {
    const a1 = assignment("a1")
    const a2 = assignment("a2", { startAt: "2026-06-01T10:00:00.000Z", endAt: "2026-06-01T16:00:00.000Z" })
    const lookup = buildRuleLookup(rules)
    const failed = evaluateHard(
      {
        soldier: soldier("s1"),
        assignment: a2,
        slot: { id: "slot", assignmentId: "a2", isLocked: false, isManual: false },
        soldierAssignments: [a1],
        workload: new Map(),
      },
      lookup,
    )
    expect(failed).toContain("no-overlap")
  })

  it("rejects a soldier missing a required certification", () => {
    const a = assignment("a", { requiredCertificationCodes: ["MEDIC"] })
    const failed = evaluateHard(
      {
        soldier: soldier("s1", { certificationCodes: [] }),
        assignment: a,
        slot: { id: "slot", assignmentId: "a", isLocked: false, isManual: false },
        soldierAssignments: [],
        workload: new Map(),
      },
      buildRuleLookup(rules),
    )
    expect(failed).toContain("certification")
  })

  it("rejects a vehicle-required duty for a soldier without a driving license", () => {
    const a = assignment("a", { requiresVehicle: true })
    const failed = evaluateHard(
      {
        soldier: soldier("s1", { hasDrivingLicense: false }),
        assignment: a,
        slot: { id: "slot", assignmentId: "a", isLocked: false, isManual: false },
        soldierAssignments: [],
        workload: new Map(),
      },
      buildRuleLookup(rules),
    )
    expect(failed).toContain("equipment")
  })
})

describe("generateSchedule (greedy)", () => {
  const baseCtx = (over: Partial<ScheduleContext> = {}): ScheduleContext => ({
    assignments: [assignment("a1")],
    slots: [{ id: "slot1", assignmentId: "a1", isLocked: false, isManual: false, soldierId: null } as EngineSlot],
    soldiers: [soldier("s1"), soldier("s2")],
    rules,
    mode: "FULL",
    ...over,
  })

  it("fills an empty slot with an eligible soldier", () => {
    const result = generateSchedule(baseCtx())
    expect(result.stats.filledSlots).toBe(1)
    const decision = result.decisions.find((d) => d.slotId === "slot1")
    expect(decision?.soldierId).toBeTruthy()
  })

  it("reports an unfilled conflict when nobody is eligible", () => {
    const ctx = baseCtx({
      assignments: [assignment("a1", { requiredCertificationCodes: ["MEDIC"] })],
      soldiers: [soldier("s1"), soldier("s2")], // none have MEDIC
    })
    const result = generateSchedule(ctx)
    expect(result.stats.unfilledSlots).toBe(1)
    expect(result.conflicts.some((c) => c.kind === "UNFILLED")).toBe(true)
  })

  it("preserves locked slots in FULL mode", () => {
    const ctx = baseCtx({
      slots: [
        { id: "slot1", assignmentId: "a1", isLocked: true, isManual: true, soldierId: "s2" } as EngineSlot,
      ],
    })
    const result = generateSchedule(ctx)
    expect(result.decisions.find((d) => d.slotId === "slot1")?.soldierId).toBe("s2")
  })

  it("balances workload across soldiers", () => {
    const ctx = baseCtx({
      assignments: [
        assignment("a1", { startAt: "2026-06-01T08:00:00.000Z", endAt: "2026-06-01T12:00:00.000Z" }),
        assignment("a2", { startAt: "2026-06-02T08:00:00.000Z", endAt: "2026-06-02T12:00:00.000Z" }),
      ],
      slots: [
        { id: "s1slot", assignmentId: "a1", isLocked: false, isManual: false, soldierId: null } as EngineSlot,
        { id: "s2slot", assignmentId: "a2", isLocked: false, isManual: false, soldierId: null } as EngineSlot,
      ],
    })
    const result = generateSchedule(ctx)
    const assigned = new Set(result.decisions.map((d) => d.soldierId))
    // Two slots on different days should spread to two soldiers via workload balance.
    expect(assigned.size).toBe(2)
  })
})
