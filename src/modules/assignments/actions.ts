"use server"

import { revalidatePath } from "next/cache"

import { writeAudit } from "@/lib/audit"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { can } from "@/lib/rbac"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { assignmentSchema, type AssignmentInput } from "./schema"
import {
  createAssignment,
  createRecurringAssignments,
  deleteAssignment,
  deleteAssignmentGroup,
  updateAssignment,
  updateAssignmentGroup,
} from "./service"

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string }

async function actor(): Promise<string | null> {
  if (PREVIEW_MODE) return null
  const session = await getSession()
  return can(session.role, "assignments:write") ? session.email : null
}

export async function createAssignmentAction(input: AssignmentInput): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = assignmentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  if (parsed.data.recurring) {
    const { groupId, count } = await createRecurringAssignments(parsed.data)
    await writeAudit({
      action: "assignment.create.recurring",
      entityType: "Assignment",
      entityId: groupId,
      after: { title: parsed.data.title, instances: count },
      actorEmail: email,
    })
    revalidatePath("/assignments")
    revalidatePath("/shavzak")
    return { ok: true, id: groupId }
  }

  const a = await createAssignment(parsed.data)
  await writeAudit({ action: "assignment.create", entityType: "Assignment", entityId: a.id, after: a, actorEmail: email })
  revalidatePath("/assignments")
  revalidatePath("/shavzak")
  return { ok: true, id: a.id }
}

export async function updateAssignmentAction(id: string, input: AssignmentInput): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = assignmentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const a = await updateAssignment(id, parsed.data)
  await writeAudit({ action: "assignment.update", entityType: "Assignment", entityId: id, after: a, actorEmail: email })
  revalidatePath("/assignments")
  revalidatePath("/shavzak")
  return { ok: true, id }
}

export async function updateAssignmentGroupAction(
  groupId: string,
  input: AssignmentInput,
): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  const parsed = assignmentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "VALIDATION" }

  const { count } = await updateAssignmentGroup(groupId, parsed.data)
  await writeAudit({
    action: "assignment.update.recurring",
    entityType: "Assignment",
    entityId: groupId,
    after: { title: parsed.data.title, instances: count },
    actorEmail: email,
  })
  revalidatePath("/assignments")
  revalidatePath("/shavzak")
  return { ok: true, id: groupId }
}

export async function deleteAssignmentAction(id: string): Promise<ActionResult> {
  const email = await actor()
  if (!email) return { ok: false, error: "FORBIDDEN" }

  // A constant assignment deletes its whole series, not just one shift instance.
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: { recurringGroupId: true },
  })
  if (assignment?.recurringGroupId) {
    await deleteAssignmentGroup(assignment.recurringGroupId)
    await writeAudit({
      action: "assignment.delete.recurring",
      entityType: "Assignment",
      entityId: assignment.recurringGroupId,
      actorEmail: email,
    })
  } else {
    await deleteAssignment(id)
    await writeAudit({ action: "assignment.delete", entityType: "Assignment", entityId: id, actorEmail: email })
  }
  revalidatePath("/assignments")
  revalidatePath("/shavzak")
  return { ok: true }
}
