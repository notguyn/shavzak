import { cookies } from "next/headers"

import { PREVIEW_MODE } from "./preview/flag"
import type { AppRole } from "./rbac"
import { ROLES } from "./rbac"

export const ROLE_COOKIE = "shavzak.role"

export interface Session {
  role: AppRole
  /** Display name resolved from the seeded user set (mock auth). */
  name: string
  email: string
}

const USERS: Record<AppRole, { name: string; email: string }> = {
  ADMIN: { name: "מנהל מערכת", email: "admin@shavzak.idf" },
  BATTALION_CMD: { name: "מפקד הגדוד", email: "battalion@shavzak.idf" },
  PLATOON_CMD: { name: "מפקד מחלקה", email: "platoon-a@shavzak.idf" },
  VIEWER: { name: "צופה", email: "viewer@shavzak.idf" },
}

function isRole(v: string | undefined): v is AppRole {
  return !!v && (ROLES as string[]).includes(v)
}

/**
 * Mock session: the active role lives in a cookie set by the role-switcher.
 * Real auth (NextAuth) will replace this resolver without touching callers.
 */
export async function getSession(): Promise<Session> {
  // Preview mode: everyone is a fixed ADMIN, no cookie/auth involved at all.
  if (PREVIEW_MODE) return { role: "ADMIN", ...USERS.ADMIN }

  const store = await cookies()
  const cookieRole = store.get(ROLE_COOKIE)?.value
  const role: AppRole = isRole(cookieRole) ? cookieRole : "VIEWER"
  return { role, ...USERS[role] }
}
