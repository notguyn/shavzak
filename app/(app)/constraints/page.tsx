import { getTranslations } from "next-intl/server"

import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { listRules } from "@/modules/constraints/service"
import { ConstraintsEditor, type RuleRow } from "@/components/constraints/constraints-editor"
import { PageHeader } from "@/components/shared/page-header"

export default async function ConstraintsPage() {
  const [rules, session, t] = await Promise.all([
    listRules(),
    getSession(),
    getTranslations("constraints"),
  ])

  const rows: RuleRow[] = rules.map((r) => ({
    id: r.id,
    key: r.key,
    kind: r.kind,
    enabled: r.enabled,
    weight: r.weight,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ConstraintsEditor rules={rows} canWrite={can(session.role, "constraints:write")} />
    </div>
  )
}
