import { prisma } from "@/lib/prisma"
import type { SoldierInput } from "./schema"

export type SoldierWithRelations = Awaited<ReturnType<typeof listSoldiers>>[number]

export function listSoldiers() {
  return prisma.soldier.findMany({
    include: { platoon: true, certifications: true },
    orderBy: { fullName: "asc" },
  })
}

export function getSoldier(id: string) {
  return prisma.soldier.findUnique({
    where: { id },
    include: { platoon: true, certifications: true, slots: { include: { assignment: true } } },
  })
}

function toBase(input: SoldierInput) {
  const { certificationIds, platoonId, ...rest } = input
  return { rest: { ...rest, platoonId: platoonId || null }, certificationIds }
}

export function createSoldier(input: SoldierInput) {
  const { rest, certificationIds } = toBase(input)
  return prisma.soldier.create({
    data: { ...rest, certifications: { connect: certificationIds.map((id) => ({ id })) } },
  })
}

export function updateSoldier(id: string, input: SoldierInput) {
  const { rest, certificationIds } = toBase(input)
  return prisma.soldier.update({
    where: { id },
    data: { ...rest, certifications: { set: certificationIds.map((id) => ({ id })) } },
  })
}

export function deleteSoldier(id: string) {
  return prisma.soldier.delete({ where: { id } })
}

export function listPlatoons() {
  return prisma.platoon.findMany({ orderBy: { name: "asc" } })
}

export function listCertifications() {
  return prisma.certification.findMany({ orderBy: { name: "asc" } })
}
