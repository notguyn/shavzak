import { getLocale, getTranslations } from "next-intl/server"
import { AlertTriangle, CalendarClock, Gauge, Scale, Users } from "lucide-react"

import { formatDateTime } from "@/lib/format"
import { getDashboardMetrics } from "@/modules/dashboard/service"
import type { Locale } from "@/i18n/config"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkloadChart } from "@/components/dashboard/workload-chart"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { typeColor } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const [m, t, tType, locale] = await Promise.all([
    getDashboardMetrics(),
    getTranslations("dashboard"),
    getTranslations("assignmentTypes"),
    getLocale() as Promise<Locale>,
  ])

  const readinessTone = m.readinessPct >= 80 ? "success" : m.readinessPct >= 50 ? "warning" : "danger"
  const fairnessTone = m.fairnessScore >= 75 ? "success" : m.fairnessScore >= 50 ? "warning" : "danger"

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("activeSoldiers")} value={m.activeSoldiers} icon={Users} />
        <StatCard
          label={t("missingManpower")}
          value={m.missingManpower}
          icon={AlertTriangle}
          tone={m.missingManpower > 0 ? "danger" : "success"}
        />
        <StatCard label={t("upcomingShifts")} value={m.upcomingShifts} icon={CalendarClock} />
        <StatCard
          label={t("readiness")}
          value={`${m.readinessPct}%`}
          icon={Gauge}
          tone={readinessTone}
          hint={
            readinessTone === "success"
              ? t("readinessGood")
              : readinessTone === "warning"
                ? t("readinessWarning")
                : t("readinessCritical")
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("workloadDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkloadChart data={m.workloadByPlatoon} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t("fairnessScore")}</CardTitle>
            <Scale className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
            <span
              className={cn(
                "text-5xl font-bold tabular-nums",
                fairnessTone === "success"
                  ? "text-chart-1"
                  : fairnessTone === "warning"
                    ? "text-chart-4"
                    : "text-destructive",
              )}
            >
              {m.fairnessScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("upcomingShiftsList")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {m.upcoming.length ? (
            m.upcoming.map((u) => {
              const color = typeColor(u.type)
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className={cn("h-8 w-1 rounded-full", color.bar)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(u.startAt, locale)}
                    </p>
                  </div>
                  <Badge variant="outline" className={color.badge}>
                    {tType(u.type as never)}
                  </Badge>
                  {u.openSlots > 0 && (
                    <Badge variant="outline" className="border-destructive/30 text-destructive">
                      {u.openSlots} {t("openSlots")}
                    </Badge>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">{t("noUpcoming")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
