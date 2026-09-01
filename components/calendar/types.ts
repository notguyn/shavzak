import type { ASSIGNMENT_TYPES, PRIORITIES } from "@/modules/assignments/schema"

/** A single assignment instance plotted on the calendar. */
export interface CalendarEvent {
  id: string
  title: string
  type: (typeof ASSIGNMENT_TYPES)[number]
  priority: (typeof PRIORITIES)[number]
  start: Date
  end: Date
  location: string | null
  filled: number
  required: number
  // Extra fields needed to reopen this event in AssignmentForm for editing.
  description: string | null
  requiredRole: string | null
  requiresWeapon: boolean
  requiresVehicle: boolean
  difficultyScore: number
  boardId: string | undefined
  requiredCertificationIds: string[]
}

/** A scheduling board's active date range, drawn as a background band. */
export interface BoardPeriod {
  id: string
  name: string
  status: string
  start: Date
  end: Date
}
