import { getLocale, getTranslations } from "next-intl/server"

import { formatDateTime } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import type { Locale } from "@/i18n/config"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/shared/page-header"

export default async function AuditPage() {
  const [logs, t, tc, locale] = await Promise.all([
    prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    getTranslations("audit"),
    getTranslations("common"),
    getLocale() as Promise<Locale>,
  ])

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t("timestamp")}</TableHead>
              <TableHead className="text-start">{t("actor")}</TableHead>
              <TableHead className="text-start">{t("action")}</TableHead>
              <TableHead className="text-start">{t("entity")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.createdAt.toISOString(), locale)}
                  </TableCell>
                  <TableCell>{log.actor?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.entityType}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {tc("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
