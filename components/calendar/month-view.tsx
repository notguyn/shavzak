"use client"

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import type { Locale } from "@/i18n/config"
import { formatTime } from "@/lib/format"
import { typeColor } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"
import type { BoardPeriod, CalendarEvent } from "./types"
import { eventsForDay, intlLocale, periodsForDay } from "./utils"


export function MonthView({
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
  const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 })
  const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weekdayFmt = new Intl.DateTimeFormat(intlLocale[locale], { weekday: "short" })
  const weekdays = days.slice(0, 7)
  const today = new Date()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
          {weekdays.map((d) => (
            <div key={d.toISOString()} className="py-2">
              {weekdayFmt.format(d)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsForDay(events, day)
            const dayPeriods = periodsForDay(periods, day)
            const inMonth = isSameMonth(day, anchor)
            const isToday = isSameDay(day, today)
            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={!canWrite}
                onClick={() => onSelectSlot(day)}
                className={cn(
                  "flex min-h-28 flex-col gap-1 border-b border-e p-1 text-start align-top transition-colors",
                  canWrite && "hover:bg-accent/40",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "mx-0.5 inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    isToday && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {day.getDate()}
                </span>
                {dayPeriods.map((p) => (
                  <span
                    key={p.id}
                    className="truncate rounded bg-secondary px-1 text-[10px] text-secondary-foreground"
                    title={p.name}
                  >
                    {p.name}
                  </span>
                ))}
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => {
                    const understaffed = e.filled < e.required
                    return (
                      <span
                        key={e.id}
                        role="button"
                        tabIndex={0}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onSelectEvent(e)
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.stopPropagation()
                            onSelectEvent(e)
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] text-white",
                          typeColor(e.type).bar,
                        )}
                        title={`${e.title} (${e.filled}/${e.required})`}
                      >
                        <span className="tabular-nums opacity-90">{formatTime(e.start, locale)}</span>
                        <span className="min-w-0 truncate">{e.title}</span>
                        {understaffed && (
                          <span className="ms-auto shrink-0 size-1.5 rounded-full bg-white/60" aria-label="understaffed" />
                        )}
                      </span>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
