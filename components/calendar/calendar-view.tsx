"use client"

import * as React from "react"
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  endOfWeek,
  setHours,
  startOfWeek,
} from "date-fns"
import { useLocale, useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { dir, type Locale } from "@/i18n/config"
import { formatDate } from "@/lib/format"
import { typeColor } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"
import { ASSIGNMENT_TYPES } from "@/modules/assignments/schema"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AssignmentForm,
  type AssignmentFormValue,
} from "@/components/assignments/assignment-form"
import type { BoardPeriod, CalendarEvent } from "./types"
import { DayView } from "./day-view"
import { MonthView } from "./month-view"
import { intlLocale, toLocalInput } from "./utils"
import { WeekView } from "./week-view"

type View = "month" | "week" | "day"
interface Option {
  id: string
  name: string
}


/** A blank assignment pre-filled with the clicked start time (1-hour default). */
function makeNewValue(date: Date, boardId: string): AssignmentFormValue {
  const start = date.getHours() === 0 && date.getMinutes() === 0 ? setHours(date, 8) : date
  const end = addHours(start, 1)
  return {
    title: "",
    type: "MISSION",
    description: "",
    location: "",
    startAt: toLocalInput(start),
    endAt: toLocalInput(end),
    requiredManpower: 1,
    requiredRole: "",
    priority: "MEDIUM",
    requiresWeapon: false,
    requiresVehicle: false,
    difficultyScore: 1,
    boardId,
    requiredCertificationIds: [],
    recurring: false,
    dayStartHour: 0,
    shiftHours: 6,
    shiftsPerDay: 4,
    manpowerPerShift: 1,
  }
}

export function CalendarView({
  events,
  periods,
  boards,
  certifications,
  canWrite,
}: {
  events: CalendarEvent[]
  periods: BoardPeriod[]
  boards: Option[]
  certifications: Option[]
  canWrite: boolean
}) {
  const t = useTranslations("calendar")
  const tc = useTranslations("common")
  const ta = useTranslations("assignmentTypes")
  const locale = useLocale() as Locale
  const [view, setView] = React.useState<View>("month")
  const [anchor, setAnchor] = React.useState(() => new Date())
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AssignmentFormValue | null>(null)
  const [activeTypes, setActiveTypes] = React.useState<Set<string>>(new Set())

  // Default to day view on small screens (one-time, on mount; client-only media read).
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- responsive default from matchMedia on mount
    if (window.matchMedia("(max-width: 767px)").matches) setView("day")
  }, [])

  const step = (delta: number) => {
    setAnchor((cur) =>
      view === "month"
        ? addMonths(cur, delta)
        : view === "week"
          ? addWeeks(cur, delta)
          : addDays(cur, delta),
    )
  }

  const rangeLabel = React.useMemo(() => {
    const il = intlLocale[locale]
    if (view === "month") {
      return new Intl.DateTimeFormat(il, { month: "long", year: "numeric" }).format(anchor)
    }
    if (view === "week") {
      const ws = startOfWeek(anchor, { weekStartsOn: 0 })
      const we = endOfWeek(anchor, { weekStartsOn: 0 })
      return `${formatDate(ws, locale)} – ${formatDate(we, locale)}`
    }
    return new Intl.DateTimeFormat(il, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(anchor)
  }, [view, anchor, locale])

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const visibleEvents = activeTypes.size === 0
    ? events
    : events.filter((e) => activeTypes.has(e.type))

  const openCreate = (date: Date) => {
    if (!canWrite) return
    setEditing(makeNewValue(date, boards[0]?.id ?? ""))
    setFormOpen(true)
  }
  const openEdit = (event: CalendarEvent) => {
    // Build the form payload here so datetime-local strings use the client timezone.
    setEditing({
      id: event.id,
      recurringGroupId: null, // edit this single instance, not the whole series
      title: event.title,
      type: event.type,
      description: event.description,
      location: event.location,
      startAt: toLocalInput(event.start),
      endAt: toLocalInput(event.end),
      requiredManpower: event.required,
      requiredRole: event.requiredRole,
      priority: event.priority,
      requiresWeapon: event.requiresWeapon,
      requiresVehicle: event.requiresVehicle,
      difficultyScore: event.difficultyScore,
      boardId: event.boardId || (boards[0]?.id ?? ""),
      requiredCertificationIds: event.requiredCertificationIds,
      recurring: false,
      dayStartHour: 0,
      shiftHours: 6,
      shiftsPerDay: 4,
      manpowerPerShift: 1,
    })
    setFormOpen(true)
  }

  // Prev/next chevrons follow reading direction.
  const PrevIcon = dir[locale] === "rtl" ? ChevronRight : ChevronLeft
  const NextIcon = dir[locale] === "rtl" ? ChevronLeft : ChevronRight

  const viewProps = {
    anchor,
    events: visibleEvents,
    periods,
    locale,
    onSelectEvent: openEdit,
    onSelectSlot: openCreate,
    canWrite,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => step(-1)} aria-label={tc("previous")}>
            <PrevIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => step(1)} aria-label={tc("next")}>
            <NextIcon className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
            {tc("today")}
          </Button>
          <span className="ms-1 text-sm font-medium">{rangeLabel}</span>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="month">{t("month")}</TabsTrigger>
            <TabsTrigger value="week">{t("week")}</TabsTrigger>
            <TabsTrigger value="day">{t("day")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap items-center gap-1.5" aria-label={t("filterByType")}>
        {ASSIGNMENT_TYPES.map((type) => {
          const active = activeTypes.has(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                active
                  ? cn("border-transparent text-white", typeColor(type).bar)
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  active ? "bg-white/70" : typeColor(type).bar,
                )}
              />
              {ta(type)}
            </button>
          )
        })}
        {activeTypes.size > 0 && (
          <button
            type="button"
            onClick={() => setActiveTypes(new Set())}
            className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
            {t("clearFilters")}
          </button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        {view === "month" && <MonthView {...viewProps} />}
        {view === "week" && <WeekView {...viewProps} />}
        {view === "day" && <DayView {...viewProps} />}
      </div>

      <AssignmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        assignment={editing}
        boards={boards}
        certifications={certifications}
      />
    </div>
  )
}
