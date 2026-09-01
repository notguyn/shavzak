"use server"

import { revalidatePath } from "next/cache"

import { writeAudit } from "@/lib/audit"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { prisma } from "@/lib/prisma"
import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"

export async function updateRuleAction(
  id: string,
  patch: { enabled?: boolean; weight?: number },
): Promise<{ ok: boolean }> {
  if (PREVIEW_MODE) return { ok: false }
  const session = await getSession()
  if (!can(session.role, "constraints:write")) return { ok: false }

  const rule = await prisma.constraintRule.update({ where: { id }, data: patch })
  await writeAudit({
    action: "constraint.update",
    entityType: "ConstraintRule",
    entityId: id,
    after: { key: rule.key, enabled: rule.enabled, weight: rule.weight },
    actorEmail: session.email,
  })
  revalidatePath("/constraints")
  return { ok: true }
}
