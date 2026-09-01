import { hoursUntil, shiftOfDay } from "../../time"
import type { SoftConstraint } from "../../types"

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/** Favour soldiers with the lightest current workload (fairness). */
const workloadBalance: SoftConstraint = {
  key: "workload-balance",
  score({ soldier, workload }) {
    const loads = [...workload.values()]
    const max = Math.max(1, ...loads)
    const mine = workload.get(soldier.id) ?? 0
    return { score: clamp01(1 - mine / max) }
  },
}

/** Favour soldiers not assigned recently (avoid hammering the same people). */
const antiRepetition: SoftConstraint = {
  key: "anti-repetition",
  score({ soldier, assignment }) {
    if (!soldier.lastAssignmentDate) return { score: 1 }
    const hrs = hoursUntil(soldier.lastAssignmentDate, assignment.startAt)
    // 0h since last -> 0 ; >= 72h -> 1
    return { score: clamp01(hrs / 72) }
  },
}

/** As release approaches, prefer nearby soldiers (distant ones travel sooner). */
const distanceBeforeRelease: SoftConstraint = {
  key: "distance-before-release",
  score({ soldier, assignment, releaseDate }) {
    if (!releaseDate) return { score: 0.5 }
    const hrsToRelease = hoursUntil(assignment.endAt, releaseDate)
    // Far in advance -> distance irrelevant (neutral 1). Close to release -> penalise distance.
    const proximity = clamp01(1 - hrsToRelease / 48) // 0 when >=48h out, 1 at release
    const distancePenalty = clamp01(soldier.travelDistanceKm / 300)
    return { score: clamp01(1 - proximity * distancePenalty) }
  },
}

/** Reward assigning a soldier to a shift they prefer. */
const shiftPreference: SoftConstraint = {
  key: "shift-preference",
  score({ soldier, assignment }) {
    const shift = shiftOfDay(assignment.startAt)
    if (soldier.preferredShifts.includes(shift)) return { score: 1 }
    return { score: 0.5 }
  },
}

/**
 * Prefer soldiers who satisfy the required certifications without burning a
 * scarce specialist on a duty that does not need their extra qualifications.
 */
const qualificationPreference: SoftConstraint = {
  key: "qualification-preference",
  score({ soldier, assignment }) {
    const required = assignment.requiredCertificationCodes
    if (required.length === 0) {
      // Keep heavily-certified soldiers in reserve for specialised duties.
      return { score: clamp01(1 - soldier.certificationCodes.length / 6) }
    }
    const has = required.every((c) => soldier.certificationCodes.includes(c))
    return { score: has ? 1 : 0 }
  },
}

export const SOFT_CONSTRAINTS: SoftConstraint[] = [
  workloadBalance,
  antiRepetition,
  distanceBeforeRelease,
  shiftPreference,
  qualificationPreference,
]

export const SOFT_CONSTRAINTS_BY_KEY = new Map(SOFT_CONSTRAINTS.map((c) => [c.key, c]))
