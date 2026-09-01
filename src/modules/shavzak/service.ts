import { prisma } from "@/lib/prisma"
import type {
  EngineAssignment,
  EngineSlot,
  EngineSoldier,
  ScheduleContext,
  ScheduleMode,
  TimeWindow,
} from "@/modules/scheduling-engine"

export function getBoard(id: string) {
  return prisma.shavzakBoard.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { requiredCertifications: true },
        orderBy: { startAt: "asc" },
      },
      slots: true,
    },
  })
}

export function getLatestBoard() {
  return prisma.shavzakBoard.findFirst({ orderBy: { updatedAt: "desc" } })
}

export function listConstraintRules() {
  return prisma.constraintRule.findMany()
}

export function listActiveSoldiers() {
  return prisma.soldier.findMany({
    include: { platoon: true, certifications: true },
    orderBy: { fullName: "asc" },
  })
}

type SoldierRecord = Awaited<ReturnType<typeof listActiveSoldiers>>[number]
type BoardRecord = NonNullable<Awaited<ReturnType<typeof getBoard>>>
type RuleRecord = Awaited<ReturnType<typeof listConstraintRules>>[number]

export function toEngineSoldier(s: SoldierRecord): EngineSoldier {
  return {
    id: s.id,
    fullName: s.fullName,
    platoonId: s.platoonId,
    rank: s.rank,
    role: s.role,
    travelDistanceKm: s.travelDistanceKm,
    certificationCodes: s.certifications.map((c) => c.code),
    hasDrivingLicense: s.hasDrivingLicense,
    medicalLimitations: s.medicalLimitations,
    preferredShifts: s.preferredShifts,
    blockedShifts: s.blockedShifts,
    maxConsecutiveDuties: s.maxConsecutiveDuties,
    availability: (s.availability as TimeWindow[] | null) ?? null,
    lastAssignmentDate: s.lastAssignmentDate?.toISOString() ?? null,
  }
}

function toEngineAssignment(a: BoardRecord["assignments"][number]): EngineAssignment {
  return {
    id: a.id,
    title: a.title,
    type: a.type,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    requiredManpower: a.requiredManpower,
    requiredRole: a.requiredRole,
    requiredCertificationCodes: a.requiredCertifications.map((c) => c.code),
    priority: a.priority,
    requiresWeapon: a.requiresWeapon,
    requiresVehicle: a.requiresVehicle,
    difficultyScore: a.difficultyScore,
  }
}

function toEngineSlot(s: BoardRecord["slots"][number]): EngineSlot {
  return {
    id: s.id,
    assignmentId: s.assignmentId,
    soldierId: s.soldierId,
    isLocked: s.isLocked,
    isManual: s.isManual,
  }
}

/** Build the engine context from persisted board + soldiers + rules. */
export function buildScheduleContext(
  board: BoardRecord,
  soldiers: SoldierRecord[],
  rules: RuleRecord[],
  mode: ScheduleMode,
): ScheduleContext {
  return {
    assignments: board.assignments.map(toEngineAssignment),
    slots: board.slots.map(toEngineSlot),
    soldiers: soldiers.map(toEngineSoldier),
    rules: rules.map((r) => ({
      key: r.key,
      kind: r.kind,
      enabled: r.enabled,
      weight: r.weight,
      params: (r.params as Record<string, unknown>) ?? null,
    })),
    mode,
    releaseDate: board.endDate.toISOString(),
    now: new Date().toISOString(),
  }
}
