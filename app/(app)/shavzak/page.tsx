import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { listBoards } from "@/modules/boards/service"
import {
  getBoard,
  getLatestBoard,
  listActiveSoldiers,
  listConstraintRules,
} from "@/modules/shavzak/service"
import { BoardManager } from "@/components/boards/board-manager"
import { PageHeader } from "@/components/shared/page-header"
import { Planner } from "@/components/shavzak/planner"
import type { PlannerData } from "@/components/shavzak/types"
import type { TimeWindow } from "@/modules/scheduling-engine"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ShavzakPage({
  searchParams,
}: {
  searchParams?: Promise<{ board?: string }>
}) {
  const params = (await searchParams) ?? {}
  const t = await getTranslations("shavzak")
  const [latest, boards, soldiers, rules, session] = await Promise.all([
    getLatestBoard(),
    listBoards(),
    listActiveSoldiers(),
    listConstraintRules(),
    getSession(),
  ])
  const chosenBoardId = params.board ?? latest?.id
  const board = chosenBoardId ? await getBoard(chosenBoardId) : null
  const canWrite = can(session.role, "shavzak:write")

  if (!board) {
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
              canWrite={canWrite}
            />
          }
        />
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("emptyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
            {canWrite && (
              <Link href="/assignments" className={buttonVariants()}>
                {t("goToAssignments")}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const data: PlannerData = {
    board: {
      id: board.id,
      name: board.name,
      startDate: board.startDate.toISOString(),
      endDate: board.endDate.toISOString(),
      status: board.status,
    },
    assignments: board.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      location: a.location,
      priority: a.priority,
      requiredManpower: a.requiredManpower,
      requiresVehicle: a.requiresVehicle,
      requiredRole: a.requiredRole,
      requiredCertificationCodes: a.requiredCertifications.map((c) => c.code),
      requiresWeapon: a.requiresWeapon,
      difficultyScore: a.difficultyScore,
    })),
    slots: board.slots.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      soldierId: s.soldierId,
      isLocked: s.isLocked,
      isManual: s.isManual,
      status: s.status,
      score: s.score,
    })),
    soldiers: soldiers.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      rank: s.rank,
      role: s.role,
      platoonId: s.platoonId,
      platoonName: s.platoon?.name ?? null,
      hasDrivingLicense: s.hasDrivingLicense,
      travelDistanceKm: s.travelDistanceKm,
      certificationCodes: s.certifications.map((c) => c.code),
      medicalLimitations: s.medicalLimitations,
      preferredShifts: s.preferredShifts,
      blockedShifts: s.blockedShifts,
      maxConsecutiveDuties: s.maxConsecutiveDuties,
      availability: s.availability as TimeWindow[] | null,
      lastAssignmentDate: s.lastAssignmentDate?.toISOString() ?? null,
    })),
    rules: rules.map((r) => ({
      key: r.key,
      kind: r.kind,
      enabled: r.enabled,
      weight: r.weight,
      params: r.params as Record<string, unknown> | null,
    })),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={board.name}
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
            currentBoardId={board.id}
            canWrite={canWrite}
          />
        }
      />
      <Planner data={data} canWrite={canWrite} />
    </div>
  )
}
