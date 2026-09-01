import type { Conflict, ConflictKind, ConstraintRuleConfig, Explanation, TimeWindow } from "@/modules/scheduling-engine"

export interface PlannerSoldier {
  id: string
  fullName: string
  rank: string
  role: string
  platoonId: string | null
  platoonName: string | null
  hasDrivingLicense: boolean
  // Engine-only fields, unused by the UI directly — carried so preview mode can
  // run generateSchedule() client-side without a round-trip (see Planner.generate).
  travelDistanceKm: number
  certificationCodes: string[]
  medicalLimitations: string[]
  preferredShifts: string[]
  blockedShifts: string[]
  maxConsecutiveDuties: number
  availability: TimeWindow[] | null
  lastAssignmentDate: string | null
}

export interface PlannerAssignment {
  id: string
  title: string
  type: string
  startAt: string
  endAt: string
  location: string | null
  priority: string
  requiredManpower: number
  requiresVehicle: boolean
  // Engine-only fields, see PlannerSoldier note above.
  requiredRole: string | null
  requiredCertificationCodes: string[]
  requiresWeapon: boolean
  difficultyScore: number
}

export interface PlannerSlot {
  id: string
  assignmentId: string
  soldierId: string | null
  isLocked: boolean
  isManual: boolean
  status: string
  score: number | null
}

export interface PlannerBoard {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
}

export interface PlannerData {
  board: PlannerBoard
  assignments: PlannerAssignment[]
  slots: PlannerSlot[]
  soldiers: PlannerSoldier[]
  /** Constraint rules — only needed for preview mode's client-side generate(). */
  rules: ConstraintRuleConfig[]
}

export type { Conflict, ConflictKind, Explanation }

/** Local slot working state keyed by slotId. */
export type SlotState = Record<
  string,
  { soldierId: string | null; isLocked: boolean; status: string; score: number | null }
>
