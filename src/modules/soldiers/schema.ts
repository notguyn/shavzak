import { z } from "zod"

export const RANKS = [
  // חוגרים
  "PRIVATE",
  "CORPORAL",
  // נגדים
  "SERGEANT",
  "STAFF_SERGEANT",
  "SERGEANT_FIRST_CLASS",
  "MASTER_SERGEANT",
  "STAFF_SERGEANT_MAJOR",
  "SENIOR_SERGEANT_MAJOR",
  "RAV_NAGAD",
  // קצינים
  "SECOND_LIEUTENANT",
  "LIEUTENANT",
  "CAPTAIN",
  "MAJOR",
  "LIEUTENANT_COLONEL",
  "COLONEL",
] as const

export const RANK_GROUPS = [
  {
    key: "enlisted",
    ranks: ["PRIVATE", "CORPORAL"],
  },
  {
    key: "nco",
    ranks: [
      "SERGEANT",
      "STAFF_SERGEANT",
      "SERGEANT_FIRST_CLASS",
      "MASTER_SERGEANT",
      "STAFF_SERGEANT_MAJOR",
      "SENIOR_SERGEANT_MAJOR",
      "RAV_NAGAD",
    ],
  },
  {
    key: "officer",
    ranks: [
      "SECOND_LIEUTENANT",
      "LIEUTENANT",
      "CAPTAIN",
      "MAJOR",
      "LIEUTENANT_COLONEL",
      "COLONEL",
    ],
  },
] as const

export const SHIFTS = ["morning", "noon", "evening", "night"] as const

/** Form/validation schema shared by the client form and the server action. */
export const soldierSchema = z.object({
  fullName: z.string().min(2),
  personalNumber: z.string().min(5).max(9),
  rank: z.enum(RANKS),
  platoonId: z.string().optional().nullable(),
  role: z.string().min(1),
  phone: z.string().optional().nullable(),
  homeCity: z.string().optional().nullable(),
  travelDistanceKm: z.coerce.number().int().min(0).max(1000).default(0),
  hasDrivingLicense: z.boolean().default(false),
  maxConsecutiveDuties: z.coerce.number().int().min(1).max(14).default(3),
  medicalLimitations: z.array(z.string()).default([]),
  preferredShifts: z.array(z.enum(SHIFTS)).default([]),
  blockedShifts: z.array(z.enum(SHIFTS)).default([]),
  certificationIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
})

export type SoldierInput = z.infer<typeof soldierSchema>
