import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import { getSoldier } from "@/modules/soldiers/service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export default async function SoldierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [soldier, t, tRanks] = await Promise.all([
    getSoldier(id),
    getTranslations("soldiers"),
    getTranslations("ranks"),
  ])
  if (!soldier) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={soldier.fullName}
        subtitle={`${tRanks(soldier.rank)} · ${soldier.role}`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/soldiers" />}>
            <ArrowRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
            {t("title")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label={t("personalNumber")} value={soldier.personalNumber} />
            <Field label={t("platoon")} value={soldier.platoon?.name} />
            <Field label={t("phone")} value={soldier.phone} />
            <Field label={t("homeCity")} value={soldier.homeCity} />
            <Field label={t("travelDistance")} value={soldier.travelDistanceKm} />
            <Field label={t("maxConsecutiveDuties")} value={soldier.maxConsecutiveDuties} />
            <Field label={t("hasDrivingLicense")} value={soldier.hasDrivingLicense ? "✓" : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("certifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1">
              {soldier.certifications.length
                ? soldier.certifications.map((c) => <Badge key={c.id}>{c.name}</Badge>)
                : "—"}
            </div>
            <Field
              label={t("medicalLimitations")}
              value={
                soldier.medicalLimitations.length
                  ? soldier.medicalLimitations.join(", ")
                  : t("noLimitations")
              }
            />
            <Field label={t("notes")} value={soldier.notes} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
