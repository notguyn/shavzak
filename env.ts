import { z } from "zod"

/**
 * Runtime environment validation. Imported at startup (next.config + prisma client)
 * so a missing/invalid var fails fast with a readable message instead of a vague
 * runtime crash deep in a request.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid postgres connection string"),
  // Default UI locale; falls back to Hebrew (the product's primary audience).
  DEFAULT_LOCALE: z.enum(["he", "en"]).default("he"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  )
  throw new Error("Invalid environment variables")
}

export const env = parsed.data
export type Env = typeof env
