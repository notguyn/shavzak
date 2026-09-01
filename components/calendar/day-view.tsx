"use client"

import type { Locale } from "@/i18n/config"
import type { BoardPeriod, CalendarEvent } from "./types"
import { TimeGrid } from "./time-grid"

export function DayView({
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
  return (
    <TimeGrid
      days={[anchor]}
      events={events}
      periods={periods}
      locale={locale}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      canWrite={canWrite}
    />
  )
}
