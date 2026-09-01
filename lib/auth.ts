import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { env } from "@/env"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // `role` is a domain field (RBAC), not a Better Auth concept — it defaults to
  // VIEWER on the Prisma model and is managed separately (see lib/rbac.ts).
})
