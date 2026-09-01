import { getTranslations } from "next-intl/server"

import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { listBoards } from "@/modules/boards/service"
import { BoardsTable, type BoardRow } from "@/components/boards/boards-table"
import { PageHeader } from "@/components/shared/page-header"

export default async function BoardsPage() {
  const [boards, session, t] = await Promise.all([
    listBoards(),
    getSession(),
    getTranslations("boards"),
  ])

  const rows: BoardRow[] = boards.map((b) => ({
    id: b.id,
    name: b.name,
    status: b.status,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    assignmentsCount: b._count.assignments,
    slotsCount: b._count.slots,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <BoardsTable rows={rows} canWrite={can(session.role, "shavzak:write")} />
    </div>
  )
}
