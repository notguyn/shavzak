/**
 * Scheduling-engine domain types. PURE data — no React, no Prisma, no I/O.
 * The service layer maps Prisma rows -> these shapes and back.
 */

export type ISODate = string

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
export type ConstraintKind = "HARD" | "SOFT"
export type ScheduleMode = "SEMI" | "FULL"

export interface TimeWindow {
  start: ISODate
  end: ISODate
}

export interface EngineSoldier {
  id: string
  fullName: string
  platoonId?: string | null
  rank: string
  role: string
  travelDistanceKm: number
  certificationCodes: string[]
  hasDrivingLicense: boolean
  medicalLimitations: string[]
  preferredShifts: string[]
  blockedShifts: string[]
  maxConsecutiveDuties: number
  /** If present, the soldier is only available within these windows. */
  availability?: TimeWindow[] | null
  lastAssignmentDate?: ISODate | null
}

export interface EngineAssignment {
  id: string
  title: string
  type: string
  startAt: ISODate
  endAt: ISODate
  requiredManpower: number
  requiredRole?: string | null
  requiredCertificationCodes: string[]
  priority: PriorityLevel
  requiresWeapon: boolean
  requiresVehicle: boolean
  difficultyScore: number
}

export interface EngineSlot {
  id: string
  assignmentId: string
  soldierId?: string | null
  isLocked: boolean
  isManual: boolean
}

export interface ConstraintRuleConfig {
  key: string
  kind: ConstraintKind
  enabled: boolean
  weight: number
  params?: Record<string, unknown> | null
}

export interface ScheduleContext {
  assignments: EngineAssignment[]
  slots: EngineSlot[]
  soldiers: EngineSoldier[]
  rules: ConstraintRuleConfig[]
  mode: ScheduleMode
  /** Reserve release date — drives the distance-before-release soft constraint. */
  releaseDate?: ISODate | null
  now?: ISODate
}

// --- Evaluation primitives -------------------------------------------------

/** A (slot, soldier) pairing evaluated against the current schedule state. */
export interface CandidateContext {
  soldier: EngineSoldier
  assignment: EngineAssignment
  slot: EngineSlot
  /** Assignments already held by this soldier in the working schedule. */
  soldierAssignments: EngineAssignment[]
  /** soldierId -> number of slots currently held (workload). */
  workload: ReadonlyMap<string, number>
  releaseDate?: ISODate | null
  params?: Record<string, unknown> | null
}

export interface HardResult {
  ok: boolean
  /** i18n key under `constraintLabels` describing the failed constraint. */
  reason?: string
}

export interface SoftResult {
  /** Normalised 0..1, higher = better candidate. */
  score: number
}

export interface HardConstraint {
  key: string
  evaluate(ctx: CandidateContext): HardResult
}

export interface SoftConstraint {
  key: string
  score(ctx: CandidateContext): SoftResult
}

// --- Results ---------------------------------------------------------------

export type ConflictKind =
  | "UNFILLED"
  | "OVERLAP"
  | "REST"
  | "CERT"
  | "MEDICAL"
  | "AVAILABILITY"
  | "EQUIPMENT"

export interface Conflict {
  slotId: string
  assignmentId: string
  kind: ConflictKind
  soldierId?: string | null
  /** i18n-ready message key + params handled by UI; raw detail kept for logs. */
  detail: string
  suggestedReplacements: ReplacementSuggestion[]
}

export interface ReplacementSuggestion {
  soldierId: string
  score: number
}

export interface SoftBreakdown {
  key: string
  weight: number
  score: number
  contribution: number
}

export interface Explanation {
  slotId: string
  soldierId?: string | null
  totalScore: number
  /** Why this soldier scored well (sorted, descending contribution). */
  breakdown: SoftBreakdown[]
  /** Hard constraints that rejected the current soldier (if any). */
  failedConstraints: string[]
  suggestedReplacements: ReplacementSuggestion[]
}

export interface SlotDecision {
  slotId: string
  soldierId: string | null
  score: number | null
}

export interface ScheduleResult {
  decisions: SlotDecision[]
  conflicts: Conflict[]
  explanations: Explanation[]
  stats: {
    totalSlots: number
    filledSlots: number
    unfilledSlots: number
    conflictCount: number
  }
}
