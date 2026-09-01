import { prisma } from "@/lib/prisma"
import type { CreateBoardInput, UpdateBoardInput } from "./schema"

export function listBoards() {
  return prisma.shavzakBoard.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { assignments: true, slots: true } } },
  })
}

export function createBoard(input: CreateBoardInput) {
  return prisma.shavzakBoard.create({
    data: {
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: input.status,
      scope: "BATTALION",
    },
  })
}

export function updateBoardStatus(boardId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  return prisma.shavzakBoard.update({ where: { id: boardId }, data: { status } })
}

export function updateBoard(input: UpdateBoardInput) {
  return prisma.shavzakBoard.update({
    where: { id: input.boardId },
    data: {
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: input.status,
    },
  })
}

export async function deleteBoard(boardId: string) {
  const board = await prisma.shavzakBoard.findUnique({
    where: { id: boardId },
    select: { _count: { select: { assignments: true } } },
  })
  if (!board) throw new Error("BOARD_NOT_FOUND")
  if (board._count.assignments > 0) throw new Error("BOARD_NOT_EMPTY")
  return prisma.shavzakBoard.delete({ where: { id: boardId } })
}

export async function duplicateBoardToNextWeek(sourceBoardId: string) {
  const source = await prisma.shavzakBoard.findUnique({ where: { id: sourceBoardId } })
  if (!source) throw new Error("BOARD_NOT_FOUND")

  const spanMs = source.endDate.getTime() - source.startDate.getTime()
  if (spanMs <= 0) throw new Error("INVALID_SOURCE_BOARD")

  const nextStart = new Date(source.endDate)
  const nextEnd = new Date(nextStart.getTime() + spanMs)

  return prisma.shavzakBoard.create({
    data: {
      name: `${source.name} (Next)`,
      startDate: nextStart,
      endDate: nextEnd,
      status: "DRAFT",
      scope: source.scope,
      platoonId: source.platoonId,
    },
  })
}
