"use server"

import { revalidatePath } from "next/cache"

import { writeAudit } from "@/lib/audit"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { prisma } from "@/lib/prisma"
import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { generateSchedule, type ScheduleMode, type ScheduleResult } from "@/modules/scheduling-engine"
import {
  buildScheduleContext,
  getBoard,
  listActiveSoldiers,
  listConstraintRules,
} from "./service"

async function canWrite(): Promise<string | null> {
  if (PREVIEW_MODE) return null
  const session = await getSession()
  return can(session.role, "shavzak:write") ? session.email : null
}

export type GenerateResult =
  | { ok: true; result: ScheduleResult }
  | { ok: false; error: string }

/** Run the engine for a board and persist the resulting assignments. */
export async function generateScheduleAction(
  boardId: string,
  mode: ScheduleMode,
): Promise<GenerateResult> {
  const actor = await canWrite()
  if (!actor) return { ok: false, error: "FORBIDDEN" }

  const [board, soldiers, rules] = await Promise.all([
    getBoard(boardId),
    listActiveSoldiers(),
    listConstraintRules(),
  ])
  if (!board) return { ok: false, error: "NOT_FOUND" }

  const ctx = buildScheduleContext(board, soldiers, rules, mode)
  const result = generateSchedule(ctx)

  const conflictedSlots = new Set(result.conflicts.map((c) => c.slotId))

  await prisma.$transaction(
    result.decisions.map((d) =>
      prisma.assignmentSlot.update({
        where: { id: d.slotId },
        data: {
          soldierId: d.soldierId,
          score: d.score,
          status: conflictedSlots.has(d.slotId)
            ? "CONFLICT"
            : d.soldierId
              ? "FILLED"
              : "EMPTY",
        },
      }),
    ),
  )

  await writeAudit({
    action: `shavzak.generate.${mode}`,
    entityType: "ShavzakBoard",
    entityId: boardId,
    after: result.stats,
    actorEmail: actor,
  })

  revalidatePath("/shavzak")
  return { ok: true, result }
}

export async function assignSlotAction(
  slotId: string,
  soldierId: string | null,
): Promise<{ ok: boolean }> {
  const actor = await canWrite()
  if (!actor) return { ok: false }

  await prisma.assignmentSlot.update({
    where: { id: slotId },
    data: {
      soldierId,
      isManual: true,
      status: soldierId ? "FILLED" : "EMPTY",
    },
  })
  revalidatePath("/shavzak")
  return { ok: true }
}

export async function toggleLockAction(
  slotId: string,
  isLocked: boolean,
): Promise<{ ok: boolean }> {
  const actor = await canWrite()
  if (!actor) return { ok: false }

  await prisma.assignmentSlot.update({
    where: { id: slotId },
    data: { isLocked, status: isLocked ? "LOCKED" : undefined },
  })
  revalidatePath("/shavzak")
  return { ok: true }
}

/** Bulk-apply a slot snapshot (used by undo/redo). */
export async function applyAssignmentsAction(
  items: { slotId: string; soldierId: string | null; isLocked: boolean }[],
): Promise<{ ok: boolean }> {
  const actor = await canWrite()
  if (!actor) return { ok: false }

  await prisma.$transaction(
    items.map((i) =>
      prisma.assignmentSlot.update({
        where: { id: i.slotId },
        data: {
          soldierId: i.soldierId,
          isLocked: i.isLocked,
          status: i.isLocked ? "LOCKED" : i.soldierId ? "FILLED" : "EMPTY",
        },
      }),
    ),
  )
  revalidatePath("/shavzak")
  return { ok: true }
}
