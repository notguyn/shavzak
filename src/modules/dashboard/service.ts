import { prisma } from "@/lib/prisma"

export interface DashboardMetrics {
  activeSoldiers: number
  missingManpower: number
  upcomingShifts: number
  readinessPct: number
  fairnessScore: number
  workloadByPlatoon: { platoon: string; assignments: number }[]
  upcoming: { id: string; title: string; type: string; startAt: string; openSlots: number }[]
}

/** Coefficient-of-variation based fairness: 100 = perfectly even workload. */
function fairness(counts: number[]): number {
  if (counts.length === 0) return 100
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length
  if (mean === 0) return 100
  const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length
  const cv = Math.sqrt(variance) / mean
  return Math.round(Math.max(0, Math.min(1, 1 - cv)) * 100)
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date()

  const [activeSoldiers, slots, soldiers, upcomingAssignments] = await Promise.all([
    prisma.soldier.count(),
    prisma.assignmentSlot.findMany({ include: { soldier: { include: { platoon: true } } } }),
    prisma.soldier.findMany({ select: { id: true } }),
    prisma.assignment.findMany({
      where: { startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 6,
      include: { slots: true },
    }),
  ])

  const missingManpower = slots.filter((s) => !s.soldierId).length
  const filled = slots.filter((s) => s.soldierId).length
  const readinessPct = slots.length ? Math.round((filled / slots.length) * 100) : 0

  // Workload counts per soldier (fairness) + per platoon (chart).
  const perSoldier = new Map<string, number>(soldiers.map((s) => [s.id, 0]))
  const perPlatoon = new Map<string, number>()
  for (const slot of slots) {
    if (!slot.soldierId) continue
    perSoldier.set(slot.soldierId, (perSoldier.get(slot.soldierId) ?? 0) + 1)
    const name = slot.soldier?.platoon?.name ?? "—"
    perPlatoon.set(name, (perPlatoon.get(name) ?? 0) + 1)
  }

  return {
    activeSoldiers,
    missingManpower,
    upcomingShifts: upcomingAssignments.length,
    readinessPct,
    fairnessScore: fairness([...perSoldier.values()]),
    workloadByPlatoon: [...perPlatoon.entries()].map(([platoon, assignments]) => ({
      platoon,
      assignments,
    })),
    upcoming: upcomingAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      startAt: a.startAt.toISOString(),
      openSlots: a.slots.filter((s) => !s.soldierId).length,
    })),
  }
}
