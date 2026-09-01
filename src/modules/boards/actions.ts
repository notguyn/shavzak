"use server"

import { revalidatePath } from "next/cache"

import { writeAudit } from "@/lib/audit"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import {
  createBoardSchema,
  deleteBoardSchema,
  duplicateNextWeekSchema,
  updateBoardSchema,
  updateBoardStatusSchema,
  type CreateBoardInput,
  type UpdateBoardInput,
} from "./schema"
import { createBoard, deleteBoard, duplicateBoardToNextWeek, updateBoard, updateBoardStatus } from "./service"

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string }

async function actor(): Promise<string | null> {
  if (PREVIEW_MODE) return null
  const session = await getSession()
  return can(session.role, "shavzak:write") ? session.email : null
}

function revalidateBoards() {
  revalidatePath("/boards")
  revalidatePath("/assignments")
  revalidatePath("/calendar")
  revalidatePath("/shavzak")
}

export async function createBoardAction(input: CreateBoardInput): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = createBoardSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const board = await createBoard(parsed.data)
  await writeAudit({ action: "board.create", entityType: "ShavzakBoard", entityId: board.id, after: board, actorEmail: email })
  revalidateBoards()
  return { ok: true, id: board.id }
}

export async function updateBoardStatusAction(input: { boardId: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = updateBoardStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const board = await updateBoardStatus(parsed.data.boardId, parsed.data.status)
  await writeAudit({
    action: "board.status.update",
    entityType: "ShavzakBoard",
    entityId: board.id,
    after: { status: board.status },
    actorEmail: email,
  })
  revalidateBoards()
  return { ok: true, id: board.id }
}

export async function updateBoardAction(input: UpdateBoardInput): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = updateBoardSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const board = await updateBoard(parsed.data)
  await writeAudit({
    action: "board.update",
    entityType: "ShavzakBoard",
    entityId: board.id,
    after: board,
    actorEmail: email,
  })
  revalidateBoards()
  return { ok: true, id: board.id }
}

export async function deleteBoardAction(input: { boardId: string }): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = deleteBoardSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  try {
    await deleteBoard(parsed.data.boardId)
  } catch (error) {
    if (error instanceof Error && error.message === "BOARD_NOT_EMPTY") return { ok: false, error: "BOARD_NOT_EMPTY" }
    throw error
  }
  await writeAudit({
    action: "board.delete",
    entityType: "ShavzakBoard",
    entityId: parsed.data.boardId,
    actorEmail: email,
  })
  revalidateBoards()
  return { ok: true, id: parsed.data.boardId }
}

export async function duplicateBoardToNextWeekAction(input: { sourceBoardId: string }): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = duplicateNextWeekSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const board = await duplicateBoardToNextWeek(parsed.data.sourceBoardId)
  await writeAudit({ action: "board.duplicate.next-week", entityType: "ShavzakBoard", entityId: board.id, after: board, actorEmail: email })
  revalidateBoards()
  return { ok: true, id: board.id }
}
