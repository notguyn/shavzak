# שבצ"ק · Shavzak — Reserve Duty Scheduling System

Production-grade battalion scheduling platform for reserve-duty officers. Assign soldiers to
missions, guard duty, shifts, transport, standby and attendance across dates/times, and
**auto-generate optimized schedules** that respect operational constraints and soldier limitations.

Hebrew-first **RTL** with full English (LTR) support, built on a clean, modular architecture where
the scheduling engine is fully decoupled from the UI.

## Stack

- **Bun** · **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **TailwindCSS v4** · **shadcn/ui** (base-nova) · **next-themes** (dark mode)
- **Prisma 7** + **PostgreSQL** (driver adapter)
- **TanStack Table** · **React Hook Form** + **Zod** · **dnd-kit** · **Recharts**
- **next-intl** (i18n, RTL/LTR, dictionaries — no hardcoded strings)

## Architecture

```
app/(app)/           Authed shell: RTL sidebar + topbar, one route per page
components/
  ui/                shadcn primitives
  layout/            sidebar, topbar, role + locale switchers, theme toggle
  shared/            DataTable (TanStack), StatCard, PageHeader
  soldiers/ shavzak/ dashboard/ analytics/ constraints/ ...
i18n/                next-intl config, request, he/en dictionaries
lib/                 prisma client, rbac, session (mock), audit, format, nav
src/modules/
  scheduling-engine/ PURE domain — no React, no Prisma (see below)
  soldiers/ shavzak/ assignments/ constraints/ analytics/ dashboard/
                     service layer: Prisma <-> DTO, Zod schemas, server actions
prisma/              schema.prisma, seed.ts
```

**Layering:** UI → module services (server actions) → scheduling-engine (pure) / Prisma. The
engine receives plain data and returns plain results — unit-testable and swappable.

### Scheduling engine (`src/modules/scheduling-engine`)

Pipeline (`engine.ts`): **hard-constraint filter → soft-constraint scoring → greedy generator →
optimizer → conflict analyzer → explainer**.

- `constraints/hard` — overlap, rest-time, certification, medical, availability, locked, equipment,
  max-consecutive (each rejects a candidate with a reason key).
- `constraints/soft` — workload balance, anti-repetition, distance-before-release, shift
  preference, qualification preference (each scores 0..1).
- `scoring/` — weighted sum (weights from `ConstraintRule` rows, fallback `weights.ts`).
- `generators/` — `AssignmentGenerator` interface + greedy implementation.
- `optimization/` — `Optimizer` interface + no-op (future simulated-annealing / ILP drops in here).
- `conflict/` — classifies conflicts (`UNFILLED|OVERLAP|REST|CERT|MEDICAL|AVAILABILITY|EQUIPMENT`)
  and suggests replacements.
- `explain/` — per-slot explanation: why selected, failed constraints, suggested swaps.

Modes (wired in the service layer): **manual**, **drag-drop**, **semi-auto** (fill empty, keep
locked), **full-auto** (regenerate everything except locked).

### RTL / i18n

Hebrew is the default locale (cookie-based, no URL segment). The root layout sets `<html dir>` from
the locale; all spacing uses **CSS logical properties** (`margin-inline`, `inset-inline`, `ms/me`,
`text-start/end`) so the same components render correctly in RTL and LTR. dnd-kit, TanStack tables,
the timeline board and charts are all RTL-validated. Add a language by dropping a dictionary in
`i18n/messages/` and extending `i18n/config.ts`.

## Setup

Prerequisites: **Bun** and **Docker** (for PostgreSQL).

```bash
# 1. Install dependencies
bun install

# 2. Environment (defaults already point at the docker postgres)
cp .env.example .env

# 3. Start PostgreSQL (+ Adminer on http://localhost:8080)
docker compose up -d db

# 4. Generate client, run migrations, seed demo data
bun run db:generate
bun run db:migrate      # creates the schema
bun run db:seed         # 2 platoons, 24 soldiers, a week-long board, constraint rules, 4 role users

# 5. Run
bun run dev             # http://localhost:3000  (defaults to Hebrew RTL)
```

### Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Dev server (Turbopack) |
| `bun run build` / `start` | Production build / serve |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint |
| `bun test` | Engine unit tests |
| `bun run db:migrate` / `db:seed` / `db:reset` / `db:studio` | Prisma DB tasks |

## Roles & permissions (mock auth)

The active role lives in a cookie and is switched from the topbar. RBAC (`lib/rbac.ts`) is enforced
in server actions and the UI. Real auth (NextAuth) can replace `lib/session.ts` without touching
callers.

| Role | Soldiers | Assignments | Shavzak | Constraints | Audit |
| --- | :-: | :-: | :-: | :-: | :-: |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Battalion Cmd | ✓ | ✓ | ✓ | – | ✓ |
| Platoon Cmd | ✓ | – | ✓ | – | – |
| Viewer | – | – | – | – | – |

## Pages

Dashboard · Soldiers (+ detail) · Assignments · **Shavzak Planner** · Constraint Rules · Analytics
· Audit Logs · Settings.

The **Shavzak Planner** is the core: daily/weekly timeline, platoon filter, drag-and-drop
assignment (RTL-aware), conflict highlighting, color-coded shift types, lock/unlock slots,
undo/redo, semi/full auto-generate, and a live explanation panel.

## Docker

`docker-compose.yml` runs PostgreSQL + Adminer. `Dockerfile` builds the app on a Bun base
(`output: "standalone"`) for deployment.
