import { PREVIEW_MODE } from "@/lib/preview/flag"
import { prisma } from "@/lib/prisma"

/** Best-effort audit trail for mutating actions. Never throws into the caller. */
export async function writeAudit(entry: {
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  actorEmail?: string
}) {
  // Preview mode never reaches here in practice (every action is blocked before
  // calling writeAudit), but guard directly too so this never touches Postgres.
  if (PREVIEW_MODE) return
  try {
    const actor = entry.actorEmail
      ? await prisma.user.findUnique({ where: { email: entry.actorEmail } })
      : null
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: entry.before === undefined ? undefined : JSON.parse(JSON.stringify(entry.before)),
        after: entry.after === undefined ? undefined : JSON.parse(JSON.stringify(entry.after)),
        actorId: actor?.id ?? null,
      },
    })
  } catch (err) {
    console.error("audit log failed", err)
  }
}
