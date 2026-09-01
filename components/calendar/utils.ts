import { endOfDay, startOfDay } from "date-fns"

import type { BoardPeriod, CalendarEvent } from "./types"

export const intlLocale: Record<"he" | "en", string> = { he: "he-IL", en: "en-US" }

/** Pixel height of one hour row in week/day views. */
export const HOUR_HEIGHT = 48
export const HOURS = Array.from({ length: 24 }, (_, h) => h)

/** Date -> "yyyy-MM-ddTHH:mm" in local time for <input type="datetime-local">. */
export function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Events overlapping the given day, sorted by start time. */
export function eventsForDay(events: CalendarEvent[], day: Date) {
  const from = startOfDay(day)
  const to = endOfDay(day)
  return events
    .filter((e) => e.start <= to && e.end >= from)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Board periods active on the given day. */
export function periodsForDay(periods: BoardPeriod[], day: Date) {
  const from = startOfDay(day)
  const to = endOfDay(day)
  return periods.filter((p) => p.start <= to && p.end >= from)
}

/** Top offset + height (px) for a timed event within a single day column. */
export function eventBox(event: CalendarEvent, day: Date) {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = endOfDay(day).getTime()
  const start = Math.max(event.start.getTime(), dayStart)
  const end = Math.min(event.end.getTime(), dayEnd)
  const top = ((start - dayStart) / 3_600_000) * HOUR_HEIGHT
  const height = Math.max(((end - start) / 3_600_000) * HOUR_HEIGHT, 18)
  return { top, height }
}
