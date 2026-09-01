import { z } from "zod"

export const ASSIGNMENT_TYPES = [
  "MISSION",
  "GUARD",
  "SHIFT",
  "TRANSPORT",
  "STANDBY",
  "ATTENDANCE",
  "TASK",
] as const

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const

export const assignmentSchema = z
  .object({
    title: z.string().min(2),
    type: z.enum(ASSIGNMENT_TYPES),
    description: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    // datetime-local strings, e.g. "2026-06-01T08:00" (ignored for recurring)
    startAt: z.string().default(""),
    endAt: z.string().default(""),
    requiredManpower: z.coerce.number().int().min(1).max(50).default(1),
    requiredRole: z.string().optional().nullable(),
    priority: z.enum(PRIORITIES).default("MEDIUM"),
    requiresWeapon: z.boolean().default(false),
    requiresVehicle: z.boolean().default(false),
    difficultyScore: z.coerce.number().int().min(1).max(10).default(1),
    boardId: z.string().min(1),
    requiredCertificationIds: z.array(z.string()).default([]),
    // Constant/recurring assignment: tile each board day into shifts soldiers rotate through.
    recurring: z.boolean().default(false),
    dayStartHour: z.coerce.number().int().min(0).max(23).default(0),
    shiftHours: z.coerce.number().int().min(1).max(24).default(6),
    shiftsPerDay: z.coerce.number().int().min(1).max(12).default(4),
    manpowerPerShift: z.coerce.number().int().min(1).max(50).default(1),
  })
  .refine((v) => v.recurring || (v.startAt !== "" && v.endAt !== ""), {
    message: "required",
    path: ["startAt"],
  })
  .refine((v) => v.recurring || v.endAt === "" || new Date(v.endAt) > new Date(v.startAt), {
    message: "endAt must be after startAt",
    path: ["endAt"],
  })
  .refine((v) => !v.recurring || v.shiftHours * v.shiftsPerDay <= 24, {
    message: "shiftsExceed24h",
    path: ["shiftsPerDay"],
  })

export type AssignmentInput = z.infer<typeof assignmentSchema>

/** Shift pattern persisted on each generated instance (in `recurring` Json). */
export interface RecurringPattern {
  dayStartHour: number
  shiftHours: number
  shiftsPerDay: number
  manpowerPerShift: number
}
