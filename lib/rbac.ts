export type AppRole = "ADMIN" | "BATTALION_CMD" | "PLATOON_CMD" | "VIEWER"

export const ROLES: AppRole[] = ["ADMIN", "BATTALION_CMD", "PLATOON_CMD", "VIEWER"]

export type Permission =
  | "soldiers:write"
  | "assignments:write"
  | "shavzak:write"
  | "constraints:write"
  | "settings:write"
  | "audit:read"

/** Capability matrix. Viewers read everything but mutate nothing. */
const MATRIX: Record<AppRole, Permission[]> = {
  ADMIN: [
    "soldiers:write",
    "assignments:write",
    "shavzak:write",
    "constraints:write",
    "settings:write",
    "audit:read",
  ],
  BATTALION_CMD: ["soldiers:write", "assignments:write", "shavzak:write", "audit:read"],
  PLATOON_CMD: ["soldiers:write", "shavzak:write"],
  VIEWER: [],
}

export function can(role: AppRole, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false
}

/** Convenience: anyone who can change *something* is not a pure viewer. */
export function canMutate(role: AppRole): boolean {
  return MATRIX[role].length > 0
}
