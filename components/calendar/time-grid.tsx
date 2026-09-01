"use client"

import * as React from "react"
import { isSameDay, setHours, startOfDay } from "date-fns"
import { useTranslations } from "next-intl"

import type { Locale } from "@/i18n/config"
import { formatTime } from "@/lib/format"
import { typeColor } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"
import type { BoardPeriod, CalendarEvent } from "./types"
import { eventBox, eventsForDay, HOUR_HEIGHT, HOURS, intlLocale, periodsForDay } from "./utils"


/** Hour-by-hour timeline shared by week (7 columns) and day (1 column) views. */
export function TimeGrid({
  days,
  events,
  periods,
  locale,
  onSelectEvent,
  onSelectSlot,
  canWrite,
}: {
  days: Date[]
  events: CalendarEvent[]
  periods: BoardPeriod[]
  locale: Locale
  onSelectEvent: (event: CalendarEvent) => void
  onSelectSlot: (date: Date) => void
  canWrite: boolean
}) {
  const t = useTranslations("calendar")
  const headFmt = new Intl.DateTimeFormat(intlLocale[locale], { weekday: "short", day: "numeric" })
  const hourFmt = new Intl.DateTimeFormat(intlLocale[locale], { hour: "2-digit" })
  const today = new Date()

  // Live current-time position, updated every minute.
  const [nowMinutes, setNowMinutes] = React.useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })
  React.useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT

  return (
    <div className="overflow-x-auto">
      <div className={cn("min-w-0", days.length > 1 && "min-w-[44rem]")}>
        {/* Header: empty corner + day labels */}
        <div
          className="grid border-b"
          style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div />
          {days.map((d) => {
            const periodNames = periodsForDay(periods, d)
            return (
              <div key={d.toISOString()} className="border-s px-1 py-2 text-center">
                <div
                  className={cn(
                    "text-xs font-medium",
                    isSameDay(d, today) ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {headFmt.format(d)}
                </div>
                {periodNames.map((p) => (
                  <div
                    key={p.id}
                    className="mt-0.5 truncate rounded bg-secondary px-1 text-[10px] text-secondary-foreground"
                    title={p.name}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Body: hour labels + day columns */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="relative border-b pe-1 text-end text-[10px] text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-1.5 end-1">{hourFmt.format(setHours(today, h))}</span>
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayEvents = eventsForDay(events, day)
            const isToday = isSameDay(day, today)
            return (
              <div key={day.toISOString()} className="relative border-s">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    disabled={!canWrite}
                    onClick={() => onSelectSlot(setHours(startOfDay(day), h))}
                    className={cn(
                      "block w-full border-b",
                      canWrite && "hover:bg-accent/40",
                    )}
                    style={{ height: HOUR_HEIGHT }}
                    aria-label={hourFmt.format(setHours(day, h))}
                  />
                ))}
                {/* Current time indicator */}
                {isToday && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="ms-0.5 size-2 shrink-0 rounded-full bg-destructive" />
                    <div className="h-px flex-1 bg-destructive" />
                  </div>
                )}
                {dayEvents.map((e) => {
                  const { top, height } = eventBox(e, day)
                  const fillPct = e.required > 0 ? Math.min(1, e.filled / e.required) : 1
                  const understaffed = e.filled < e.required
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelectEvent(e)}
                      className={cn(
                        "absolute inset-x-0.5 overflow-hidden rounded px-1 py-0.5 text-start text-[10px] text-white shadow-sm",
                        typeColor(e.type).bar,
                      )}
                      style={{ top, height }}
                      title={`${e.title} — ${t("staffing", { filled: e.filled, required: e.required })}`}
                    >
                      <div className="truncate font-medium">{e.title}</div>
                      <div className="tabular-nums opacity-90">{formatTime(e.start, locale)}</div>
                      {height >= 36 && (
                        <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-white/30">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              understaffed ? "bg-white/60" : "bg-white/90",
                            )}
                            style={{ width: `${fillPct * 100}%` }}
                          />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
