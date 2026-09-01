import { getTranslations } from "next-intl/server"

import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { listAssignments, listBoards } from "@/modules/assignments/service"
import { listCertifications } from "@/modules/soldiers/service"
import { CalendarView } from "@/components/calendar/calendar-view"
import type { BoardPeriod, CalendarEvent } from "@/components/calendar/types"
import { PageHeader } from "@/components/shared/page-header"

export default async function CalendarPage() {
  const [assignments, boards, certifications, session, t] = await Promise.all([
    listAssignments(),
    listBoards(),
    listCertifications(),
    getSession(),
    getTranslations("calendar"),
  ])

  // One event per assignment instance — recurring series are NOT collapsed here.
  const events: CalendarEvent[] = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    priority: a.priority,
    start: a.startAt,
    end: a.endAt,
    location: a.location,
    filled: a.slots.filter((s) => s.soldierId).length,
    required: a.requiredManpower,
    description: a.description,
    requiredRole: a.requiredRole,
    requiresWeapon: a.requiresWeapon,
    requiresVehicle: a.requiresVehicle,
    difficultyScore: a.difficultyScore,
    boardId: a.boardId ?? undefined,
    requiredCertificationIds: a.requiredCertifications.map((c) => c.id),
  }))

  const periods: BoardPeriod[] = boards.map((b) => ({
    id: b.id,
    name: b.name,
    status: b.status,
    start: b.startDate,
    end: b.endDate,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CalendarView
        events={events}
        periods={periods}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        certifications={certifications.map((c) => ({ id: c.id, name: c.name }))}
        canWrite={can(session.role, "assignments:write")}
      />
    </div>
  )
}
