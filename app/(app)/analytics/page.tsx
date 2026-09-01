import { getTranslations } from "next-intl/server"
import { TriangleAlert, Users2 } from "lucide-react"

import { getAnalytics } from "@/modules/analytics/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RankBars } from "@/components/analytics/rank-bars"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"

export default async function AnalyticsPage() {
  const [a, t] = await Promise.all([getAnalytics(), getTranslations("analytics")])

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label={t("workloadBalance")} value={a.totalAssigned} icon={Users2} />
        <StatCard
          label={t("conflictFrequency")}
          value={a.conflictCount}
          icon={TriangleAlert}
          tone={a.conflictCount > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("mostAssigned")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBars items={a.mostAssigned} barClass="bg-chart-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("underused")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBars items={a.underused} barClass="bg-chart-4" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("qualificationCoverage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBars items={a.qualificationCoverage} barClass="bg-chart-3" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
