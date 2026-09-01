import type { EngineAssignment, ISODate, TimeWindow } from "./types"

export type ShiftOfDay = "night" | "morning" | "noon" | "evening"

export function ms(date: ISODate): number {
  return new Date(date).getTime()
}

/** Two assignments overlap if their [start, end) intervals intersect. */
export function overlaps(a: EngineAssignment, b: EngineAssignment): boolean {
  return ms(a.startAt) < ms(b.endAt) && ms(b.startAt) < ms(a.endAt)
}

/** Hours of rest between two non-overlapping assignments (0 if they overlap). */
export function restGapHours(a: EngineAssignment, b: EngineAssignment): number {
  if (overlaps(a, b)) return 0
  const gap = ms(a.startAt) >= ms(b.endAt) ? ms(a.startAt) - ms(b.endAt) : ms(b.startAt) - ms(a.endAt)
  return gap / (1000 * 60 * 60)
}

export function shiftOfDay(date: ISODate): ShiftOfDay {
  const h = new Date(date).getHours()
  if (h < 6) return "night"
  if (h < 12) return "morning"
  if (h < 18) return "noon"
  return "evening"
}

export function dayKey(date: ISODate): string {
  return new Date(date).toISOString().slice(0, 10)
}

export function withinWindow(assignment: EngineAssignment, windows: TimeWindow[]): boolean {
  return windows.some((w) => ms(assignment.startAt) >= ms(w.start) && ms(assignment.endAt) <= ms(w.end))
}

export function hoursUntil(from: ISODate, to: ISODate): number {
  return (ms(to) - ms(from)) / (1000 * 60 * 60)
}
