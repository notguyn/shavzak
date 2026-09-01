import { randomUUID } from "node:crypto"

import { prisma } from "@/lib/prisma"
import type { AssignmentInput } from "./schema"

export function listAssignments() {
  return prisma.assignment.findMany({
    include: { requiredCertifications: true, slots: true },
    orderBy: { startAt: "asc" },
  })
}

export function listBoards() {
  return prisma.shavzakBoard.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { assignments: true, slots: true } } },
  })
}

function toData(input: AssignmentInput) {
  return {
    title: input.title,
    type: input.type,
    description: input.description,
    location: input.location,
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    requiredManpower: input.requiredManpower,
    requiredRole: input.requiredRole,
    priority: input.priority,
    requiresWeapon: input.requiresWeapon,
    requiresVehicle: input.requiresVehicle,
    difficultyScore: input.difficultyScore,
    boardId: input.boardId,
  }
}

/** Create the assignment plus one EMPTY slot per required head. */
export function createAssignment(input: AssignmentInput) {
  const { requiredCertificationIds, boardId } = input
  return prisma.assignment.create({
    data: {
      ...toData(input),
      requiredCertifications: { connect: requiredCertificationIds.map((id) => ({ id })) },
      slots: {
        create: Array.from({ length: input.requiredManpower }, () => ({
          boardId,
          status: "EMPTY" as const,
        })),
      },
    },
  })
}

/** Update fields and reconcile slot count to match requiredManpower. */
export async function updateAssignment(id: string, input: AssignmentInput) {
  const { requiredCertificationIds } = input

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assignment.update({
      where: { id },
      data: {
        ...toData(input),
        requiredCertifications: { set: requiredCertificationIds.map((cid) => ({ id: cid })) },
      },
    })

    const slots = await tx.assignmentSlot.findMany({ where: { assignmentId: id } })
    const diff = input.requiredManpower - slots.length
    if (diff > 0) {
      await tx.assignmentSlot.createMany({
        data: Array.from({ length: diff }, () => ({
          assignmentId: id,
          boardId: input.boardId,
          status: "EMPTY" as const,
        })),
      })
    } else if (diff < 0) {
      // Drop empty/unassigned slots first; keep filled ones.
      const removable = slots
        .filter((s) => !s.soldierId)
        .slice(0, -diff)
        .map((s) => s.id)
      if (removable.length) {
        await tx.assignmentSlot.deleteMany({ where: { id: { in: removable } } })
      }
    }
    return updated
  })
}

export function deleteAssignment(id: string) {
  // Slots cascade via the schema relation.
  return prisma.assignment.delete({ where: { id } })
}

/** Delete every per-day shift instance of a constant assignment. */
export function deleteAssignmentGroup(groupId: string) {
  return prisma.assignment.deleteMany({ where: { recurringGroupId: groupId } })
}

/**
 * Expand a constant assignment into one instance per shift per board-day.
 * Each shift is its own slot set; the engine's overlap/rest/workload constraints
 * then rotate different soldiers through consecutive shifts automatically.
 */
export async function createRecurringAssignments(input: AssignmentInput, reuseGroupId?: string) {
  const board = await prisma.shavzakBoard.findUnique({ where: { id: input.boardId } })
  if (!board) throw new Error("BOARD_NOT_FOUND")

  const groupId = reuseGroupId ?? randomUUID()
  const pattern = {
    dayStartHour: input.dayStartHour,
    shiftHours: input.shiftHours,
    shiftsPerDay: input.shiftsPerDay,
    manpowerPerShift: input.manpowerPerShift,
  }

  const start = new Date(board.startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(board.endDate)
  end.setHours(0, 0, 0, 0)

  const creates = []
  for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
    for (let s = 0; s < input.shiftsPerDay; s++) {
      const startAt = new Date(day)
      startAt.setHours(input.dayStartHour + s * input.shiftHours, 0, 0, 0)
      const endAt = new Date(startAt)
      endAt.setHours(endAt.getHours() + input.shiftHours)

      creates.push(
        prisma.assignment.create({
          data: {
            title: input.title,
            type: input.type,
            description: input.description,
            location: input.location,
            startAt,
            endAt,
            requiredManpower: input.manpowerPerShift,
            requiredRole: input.requiredRole,
            priority: input.priority,
            requiresWeapon: input.requiresWeapon,
            requiresVehicle: input.requiresVehicle,
            difficultyScore: input.difficultyScore,
            boardId: input.boardId,
            recurring: pattern,
            recurringGroupId: groupId,
            requiredCertifications: {
              connect: input.requiredCertificationIds.map((id) => ({ id })),
            },
            slots: {
              create: Array.from({ length: input.manpowerPerShift }, () => ({
                boardId: input.boardId,
                status: "EMPTY" as const,
              })),
            },
          },
        }),
      )
    }
  }

  await prisma.$transaction(creates)
  return { groupId, count: creates.length }
}

/**
 * Edit a constant assignment series.
 * - Shared-field-only changes update every instance in place (keeps soldiers).
 * - A changed shift pattern or board regenerates the series (resets assignments),
 *   reusing the same group id.
 */
export async function updateAssignmentGroup(groupId: string, input: AssignmentInput) {
  const instances = await prisma.assignment.findMany({
    where: { recurringGroupId: groupId },
    select: { id: true, boardId: true, recurring: true },
  })
  if (instances.length === 0) throw new Error("GROUP_NOT_FOUND")

  const stored = (instances[0].recurring ?? {}) as Partial<{
    dayStartHour: number
    shiftHours: number
    shiftsPerDay: number
    manpowerPerShift: number
  }>
  const patternChanged =
    stored.dayStartHour !== input.dayStartHour ||
    stored.shiftHours !== input.shiftHours ||
    stored.shiftsPerDay !== input.shiftsPerDay ||
    stored.manpowerPerShift !== input.manpowerPerShift ||
    instances[0].boardId !== input.boardId

  if (patternChanged) {
    await prisma.assignment.deleteMany({ where: { recurringGroupId: groupId } })
    return createRecurringAssignments(input, groupId)
  }

  // Shared fields only: update each instance, preserve slots/soldiers.
  const shared = {
    title: input.title,
    type: input.type,
    description: input.description,
    location: input.location,
    requiredRole: input.requiredRole,
    priority: input.priority,
    requiresWeapon: input.requiresWeapon,
    requiresVehicle: input.requiresVehicle,
    difficultyScore: input.difficultyScore,
  }
  await prisma.$transaction(
    instances.map((i) =>
      prisma.assignment.update({
        where: { id: i.id },
        data: {
          ...shared,
          requiredCertifications: { set: input.requiredCertificationIds.map((id) => ({ id })) },
        },
      }),
    ),
  )
  return { groupId, count: instances.length }
}
