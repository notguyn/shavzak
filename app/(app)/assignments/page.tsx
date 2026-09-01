import { getTranslations } from "next-intl/server"

import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { listAssignments, listBoards } from "@/modules/assignments/service"
import { listCertifications } from "@/modules/soldiers/service"
import { AssignmentsTable, type AssignmentRow } from "@/components/assignments/assignments-table"
import { BoardManager } from "@/components/boards/board-manager"
import { PageHeader } from "@/components/shared/page-header"

export default async function AssignmentsPage() {
  const [assignments, boards, certifications, session, t] = await Promise.all([
    listAssignments(),
    listBoards(),
    listCertifications(),
    getSession(),
    getTranslations("assignments"),
  ])

  const toRow = (a: (typeof assignments)[number]): AssignmentRow => ({
    id: a.id,
    title: a.title,
    type: a.type,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    location: a.location,
    description: a.description,
    priority: a.priority,
    requiredManpower: a.requiredManpower,
    requiredRole: a.requiredRole,
    requiresWeapon: a.requiresWeapon,
    requiresVehicle: a.requiresVehicle,
    difficultyScore: a.difficultyScore,
    boardId: a.boardId ?? "",
    requiredCertificationIds: a.requiredCertifications.map((c) => c.id),
    filled: a.slots.filter((s) => s.soldierId).length,
    recurring: false,
    instances: 1,
    recurringGroupId: a.recurringGroupId,
    dayStartHour: 0,
    shiftHours: 6,
    shiftsPerDay: 4,
    manpowerPerShift: 1,
  })

  // Collapse each constant-assignment series into a single representative row.
  const groups = new Map<string, typeof assignments>()
  const rows: AssignmentRow[] = []
  for (const a of assignments) {
    if (a.recurringGroupId) {
      const list = groups.get(a.recurringGroupId) ?? []
      list.push(a)
      groups.set(a.recurringGroupId, list)
    } else {
      rows.push(toRow(a))
    }
  }
  for (const list of groups.values()) {
    const sorted = [...list].sort((x, y) => x.startAt.getTime() - y.startAt.getTime())
    const rep = toRow(sorted[0])
    const pattern = (sorted[0].recurring ?? {}) as Partial<{
      dayStartHour: number
      shiftHours: number
      shiftsPerDay: number
      manpowerPerShift: number
    }>
    rep.recurring = true
    rep.instances = list.length
    rep.requiredManpower = list.reduce((sum, a) => sum + a.requiredManpower, 0)
    rep.filled = list.reduce((sum, a) => sum + a.slots.filter((s) => s.soldierId).length, 0)
    rep.dayStartHour = pattern.dayStartHour ?? 0
    rep.shiftHours = pattern.shiftHours ?? 6
    rep.shiftsPerDay = pattern.shiftsPerDay ?? 4
    rep.manpowerPerShift = pattern.manpowerPerShift ?? 1
    rows.push(rep)
  }
  rows.sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <BoardManager
            boards={boards.map((b) => ({
              id: b.id,
              name: b.name,
              startDate: b.startDate.toISOString(),
              endDate: b.endDate.toISOString(),
              status: b.status,
              assignmentsCount: b._count.assignments,
              slotsCount: b._count.slots,
            }))}
            canWrite={can(session.role, "shavzak:write")}
          />
        }
      />
      <AssignmentsTable
        rows={rows}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        certifications={certifications.map((c) => ({ id: c.id, name: c.name }))}
        canWrite={can(session.role, "assignments:write")}
      />
    </div>
  )
}
