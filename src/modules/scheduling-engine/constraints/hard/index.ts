import { dayKey, overlaps, restGapHours, shiftOfDay, withinWindow } from "../../time"
import type { HardConstraint } from "../../types"

/** Soldier must not be double-booked at overlapping times. */
const noOverlap: HardConstraint = {
  key: "no-overlap",
  evaluate({ assignment, soldierAssignments }) {
    const clash = soldierAssignments.some((a) => a.id !== assignment.id && overlaps(a, assignment))
    return clash ? { ok: false, reason: "no-overlap" } : { ok: true }
  },
}

/** Minimum rest between consecutive duties (default 8h, override via params.minRestHours). */
const restTime: HardConstraint = {
  key: "rest-time",
  evaluate({ assignment, soldierAssignments, params }) {
    const min = Number(params?.minRestHours ?? 8)
    for (const a of soldierAssignments) {
      if (a.id === assignment.id) continue
      if (restGapHours(a, assignment) < min) return { ok: false, reason: "rest-time" }
    }
    return { ok: true }
  },
}

/** Soldier must hold every certification the assignment requires. */
const certification: HardConstraint = {
  key: "certification",
  evaluate({ assignment, soldier }) {
    const ok = assignment.requiredCertificationCodes.every((c) =>
      soldier.certificationCodes.includes(c),
    )
    return ok ? { ok: true } : { ok: false, reason: "certification" }
  },
}

/**
 * Medical limitations block matching duties. Convention: a limitation string
 * containing "ליל" / "night" blocks night shifts; "שמיר" / "guard" blocks GUARD.
 */
const medical: HardConstraint = {
  key: "medical",
  evaluate({ assignment, soldier }) {
    const shift = shiftOfDay(assignment.startAt)
    for (const lim of soldier.medicalLimitations) {
      const l = lim.toLowerCase()
      if ((l.includes("ליל") || l.includes("night")) && shift === "night")
        return { ok: false, reason: "medical" }
      if ((l.includes("שמיר") || l.includes("guard")) && assignment.type === "GUARD")
        return { ok: false, reason: "medical" }
    }
    return { ok: true }
  },
}

/** Respect availability windows and explicitly blocked shifts. */
const availability: HardConstraint = {
  key: "availability",
  evaluate({ assignment, soldier }) {
    if (soldier.blockedShifts.includes(shiftOfDay(assignment.startAt)))
      return { ok: false, reason: "availability" }
    if (soldier.availability && soldier.availability.length > 0) {
      if (!withinWindow(assignment, soldier.availability)) return { ok: false, reason: "availability" }
    }
    return { ok: true }
  },
}

/** Never reassign a locked slot away from its current soldier. */
const locked: HardConstraint = {
  key: "locked",
  evaluate({ slot, soldier }) {
    if (slot.isLocked && slot.soldierId && slot.soldierId !== soldier.id)
      return { ok: false, reason: "locked" }
    return { ok: true }
  },
}

/** Required vehicle license. */
const equipment: HardConstraint = {
  key: "equipment",
  evaluate({ assignment, soldier }) {
    if (assignment.requiresVehicle && !soldier.hasDrivingLicense)
      return { ok: false, reason: "equipment" }
    return { ok: true }
  },
}

/** Cap on consecutive duty days (counts distinct days incl. the candidate). */
const maxConsecutive: HardConstraint = {
  key: "max-consecutive",
  evaluate({ assignment, soldier, soldierAssignments }) {
    const days = new Set(soldierAssignments.map((a) => dayKey(a.startAt)))
    days.add(dayKey(assignment.startAt))
    const sorted = [...days].sort()
    let run = 1
    let longest = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]).getTime()
      const cur = new Date(sorted[i]).getTime()
      const consecutive = cur - prev === 24 * 60 * 60 * 1000
      run = consecutive ? run + 1 : 1
      longest = Math.max(longest, run)
    }
    return longest > soldier.maxConsecutiveDuties
      ? { ok: false, reason: "max-consecutive" }
      : { ok: true }
  },
}

export const HARD_CONSTRAINTS: HardConstraint[] = [
  noOverlap,
  restTime,
  certification,
  medical,
  availability,
  locked,
  equipment,
  maxConsecutive,
]

export const HARD_CONSTRAINTS_BY_KEY = new Map(HARD_CONSTRAINTS.map((c) => [c.key, c]))
