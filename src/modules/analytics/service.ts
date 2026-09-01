import { prisma } from "@/lib/prisma"

export interface AnalyticsData {
  mostAssigned: { name: string; count: number }[]
  underused: { name: string; count: number }[]
  qualificationCoverage: { name: string; count: number }[]
  conflictCount: number
  totalAssigned: number
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const [soldiers, slots, certifications] = await Promise.all([
    prisma.soldier.findMany({ select: { id: true, fullName: true } }),
    prisma.assignmentSlot.findMany({ select: { soldierId: true, status: true } }),
    prisma.certification.findMany({ include: { _count: { select: { soldiers: true } } } }),
  ])

  const count = new Map<string, number>(soldiers.map((s) => [s.id, 0]))
  for (const slot of slots) {
    if (slot.soldierId) count.set(slot.soldierId, (count.get(slot.soldierId) ?? 0) + 1)
  }

  const ranked = soldiers
    .map((s) => ({ name: s.fullName, count: count.get(s.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)

  return {
    mostAssigned: ranked.slice(0, 8),
    underused: [...ranked].reverse().slice(0, 8),
    qualificationCoverage: certifications.map((c) => ({ name: c.name, count: c._count.soldiers })),
    conflictCount: slots.filter((s) => s.status === "CONFLICT").length,
    totalAssigned: slots.filter((s) => s.soldierId).length,
  }
}
