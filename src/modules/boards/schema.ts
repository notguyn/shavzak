import { z } from "zod"

export const BOARD_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const

export const createBoardSchema = z
  .object({
    name: z.string().min(2),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    status: z.enum(BOARD_STATUSES).default("DRAFT"),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  })

export const updateBoardStatusSchema = z.object({
  boardId: z.string().min(1),
  status: z.enum(BOARD_STATUSES),
})

export const updateBoardSchema = z
  .object({
    boardId: z.string().min(1),
    name: z.string().min(2),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    status: z.enum(BOARD_STATUSES),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  })

export const deleteBoardSchema = z.object({
  boardId: z.string().min(1),
})

export const duplicateNextWeekSchema = z.object({
  sourceBoardId: z.string().min(1),
})

export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardStatusInput = z.infer<typeof updateBoardStatusSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>
export type DuplicateNextWeekInput = z.infer<typeof duplicateNextWeekSchema>
