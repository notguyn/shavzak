"use server"

import { revalidatePath } from "next/cache"

import { writeAudit } from "@/lib/audit"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { soldierSchema, type SoldierInput } from "./schema"
import { createSoldier, deleteSoldier, updateSoldier } from "./service"

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string }

async function assertCanWrite(): Promise<{ email: string } | null> {
  const session = await getSession()
  if (!can(session.role, "soldiers:write")) return null
  return { email: session.email }
}

export async function createSoldierAction(input: SoldierInput): Promise<ActionResult> {
  if (PREVIEW_MODE) return { ok: false, error: "PREVIEW_MODE" }
  const actor = await assertCanWrite()
  if (!actor) return { ok: false, error: "FORBIDDEN" }

  const parsed = soldierSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const soldier = await createSoldier(parsed.data)
  await writeAudit({
    action: "soldier.create",
    entityType: "Soldier",
    entityId: soldier.id,
    after: soldier,
    actorEmail: actor.email,
  })
  revalidatePath("/soldiers")
  return { ok: true, id: soldier.id }
}

export async function updateSoldierAction(id: string, input: SoldierInput): Promise<ActionResult> {
  if (PREVIEW_MODE) return { ok: false, error: "PREVIEW_MODE" }
  const actor = await assertCanWrite()
  if (!actor) return { ok: false, error: "FORBIDDEN" }

  const parsed = soldierSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const soldier = await updateSoldier(id, parsed.data)
  await writeAudit({
    action: "soldier.update",
    entityType: "Soldier",
    entityId: id,
    after: soldier,
    actorEmail: actor.email,
  })
  revalidatePath("/soldiers")
  revalidatePath(`/soldiers/${id}`)
  return { ok: true, id }
}

export async function deleteSoldierAction(id: string): Promise<ActionResult> {
  if (PREVIEW_MODE) return { ok: false, error: "PREVIEW_MODE" }
  const actor = await assertCanWrite()
  if (!actor) return { ok: false, error: "FORBIDDEN" }

  await deleteSoldier(id)
  await writeAudit({
    action: "soldier.delete",
    entityType: "Soldier",
    entityId: id,
    actorEmail: actor.email,
  })
  revalidatePath("/soldiers")
  return { ok: true }
}
