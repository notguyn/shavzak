/**
 * Preview mode: a read-only demo toggle. Pages still read live from Postgres
 * (seeded, never written to in this mode), but every mutation is redirected
 * into an in-browser store instead (see lib/preview/store.ts) and auth is
 * bypassed with a fixed ADMIN identity (see lib/session.ts, proxy.ts).
 *
 * NEXT_PUBLIC_ because both server code (proxy.ts, server actions) and client
 * components (forms/tables) branch on it — deliberately NOT routed through
 * env.ts's Zod schema, which requires server-only secrets and would throw if
 * ever imported into a client bundle.
 */
export const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true"
