"use client"

import { eachDayOfInterval, endOfWeek, startOfWeek } from "date-fns"

import type { Locale } from "@/i18n/config"
import type { BoardPeriod, CalendarEvent } from "./types"
import { TimeGrid } from "./time-grid"

export function WeekView({
  anchor,
  events,
  periods,
  locale,
  onSelectEvent,
  onSelectSlot,
  canWrite,
}: {
  anchor: Date
  events: CalendarEvent[]
  periods: BoardPeriod[]
  locale: Locale
  onSelectEvent: (event: CalendarEvent) => void
  onSelectSlot: (date: Date) => void
  canWrite: boolean
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(anchor, { weekStartsOn: 0 }),
    end: endOfWeek(anchor, { weekStartsOn: 0 }),
  })
  return (
    <TimeGrid
      days={days}
      events={events}
      periods={periods}
      locale={locale}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      canWrite={canWrite}
    />
  )
}
