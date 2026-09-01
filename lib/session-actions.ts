"use server"

import { cookies } from "next/headers"

import { ROLES, type AppRole } from "./rbac"
import { ROLE_COOKIE } from "./session"

export async function setRole(role: AppRole) {
  if (!(ROLES as string[]).includes(role)) return
  const store = await cookies()
  store.set(ROLE_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
}
