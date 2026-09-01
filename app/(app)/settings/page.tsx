import { getLocale, getTranslations } from "next-intl/server"

import { getSession } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsPanel } from "@/components/settings/settings-panel"

export default async function SettingsPage() {
  const [locale, session, t, tRoles] = await Promise.all([
    getLocale(),
    getSession(),
    getTranslations("settings"),
    getTranslations("roles"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsPanel currentLocale={locale} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("role")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="text-sm">
            {tRoles(session.role)}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
