import { getTranslations } from "next-intl/server"

import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import {
  listCertifications,
  listPlatoons,
  listSoldiers,
} from "@/modules/soldiers/service"
import { PageHeader } from "@/components/shared/page-header"
import { SoldiersTable, type SoldierRow } from "@/components/soldiers/soldiers-table"

export default async function SoldiersPage() {
  const t = await getTranslations("soldiers")
  const [soldiers, platoons, certifications, session] = await Promise.all([
    listSoldiers(),
    listPlatoons(),
    listCertifications(),
    getSession(),
  ])

  const rows: SoldierRow[] = soldiers.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    personalNumber: s.personalNumber,
    rank: s.rank,
    role: s.role,
    platoonId: s.platoonId,
    platoonName: s.platoon?.name ?? null,
    phone: s.phone,
    homeCity: s.homeCity,
    travelDistanceKm: s.travelDistanceKm,
    hasDrivingLicense: s.hasDrivingLicense,
    maxConsecutiveDuties: s.maxConsecutiveDuties,
    medicalLimitations: s.medicalLimitations,
    preferredShifts: s.preferredShifts as SoldierRow["preferredShifts"],
    blockedShifts: s.blockedShifts as SoldierRow["blockedShifts"],
    certificationIds: s.certifications.map((c) => c.id),
    certNames: s.certifications.map((c) => c.name),
    tags: s.tags,
    notes: s.notes,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SoldiersTable
        soldiers={rows}
        platoons={platoons.map((p) => ({ id: p.id, name: p.name }))}
        certifications={certifications.map((c) => ({ id: c.id, name: c.name }))}
        canWrite={can(session.role, "soldiers:write")}
      />
    </div>
  )
}
