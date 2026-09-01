# Graph Report - .  (2026-09-01)

## Corpus Check
- Corpus is ~44,427 words - fits in a single context window. You may not need a graph.

## Summary
- 826 nodes · 2165 edges · 64 communities (28 shown, 36 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.74)
- Token cost: 78,000 input · 14,833 output

## Community Hubs (Navigation)
- Scheduling Engine Core
- App Routes & Pages
- Calendar & Board Views
- App Shell & Layout
- Server Actions & Data Layer
- UI/UX Skill Rules
- TypeScript Config
- Forms & Board Management
- Avatar & Card Primitives
- Tables & Dropdown Menus
- Buttons & Date Pickers
- shadcn Registry Config
- Soldier Form
- Data Table Stack
- Form Validation Primitives
- Alert Dialog Stack
- Dev Tooling Deps
- Package Scripts
- Root Layout & Theming
- React Component Consumers
- Dialog Primitives
- Core Runtime Deps
- Tabs Primitives
- Database Seeding
- Package Metadata
- Next.js Config
- Base UI React Dep
- CVA Styling Dep
- clsx Dep
- dnd-kit Core Dep
- dnd-kit Sortable Dep
- dnd-kit Utilities Dep
- ESLint Config
- ESLint Next Config Dep
- ESLint RC Dep
- Hookform Resolvers Dep
- jsPDF Dep
- jsPDF Autotable Dep
- Lucide Icons Dep
- Next.js Dep
- next-themes Dep
- node-postgres Dep
- Prisma PG Adapter Dep
- React DOM Dep
- React Hook Form Dep
- Recharts Dep
- shadcn CLI Dep
- Sonner Toast Dep
- tailwind-merge Dep
- TanStack Table Dep
- tw-animate-css Dep
- xlsx Dep
- Zod Dep
- PostCSS Dep
- Prettier Tailwind Plugin
- Tailwind PostCSS Dep
- Bun Types Dep
- Node Types Dep
- React Types Dep
- React DOM Types Dep
- TypeScript Dep
- PostCSS Config

## God Nodes (most connected - your core abstractions)
1. `cn()` - 175 edges
2. `getSession()` - 28 edges
3. `Button()` - 26 edges
4. `react` - 26 edges
5. `can()` - 23 edges
6. `Locale` - 21 edges
7. `writeAudit()` - 20 edges
8. `EngineAssignment` - 17 edges
9. `compilerOptions` - 17 edges
10. `typeColor()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Master + Overrides Persistence Pattern` --semantically_similar_to--> `RTL / i18n (Hebrew-default, logical properties)`  [INFERRED] [semantically similar]
  .agents/skills/ui-ux-pro-max/SKILL.md → README.md
- `UI Pre-Delivery Checklist` --semantically_similar_to--> `Review direct_prompt Criteria`  [INFERRED] [semantically similar]
  .agents/skills/ui-ux-pro-max/SKILL.md → .github/workflows/code-review.yml
- `AppLayout()` --calls--> `getSession()`  [EXTRACTED]
  app/(app)/layout.tsx → lib/session.ts
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  app/layout.tsx → lib/utils.ts
- `ThemeHotkey()` --references--> `react`  [EXTRACTED]
  components/theme-provider.tsx → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Scheduling Engine Pipeline** — readme_hard_constraints, readme_soft_constraints, readme_scoring, readme_assignment_generator, readme_optimizer, readme_conflict_analyzer, readme_explainer [EXTRACTED 1.00]
- **Local Dev Stack Bootstrap** — docker_compose_db, docker_compose_adminer, readme_prisma_postgres, readme_db_seed [INFERRED 0.95]
- **Design System Generation Workflow** — _agents_skills_ui_ux_pro_max_skill_search_py, _agents_skills_ui_ux_pro_max_skill_design_system_flag, _agents_skills_ui_ux_pro_max_skill_ui_reasoning_csv, _agents_skills_ui_ux_pro_max_skill_master_overrides_pattern, _agents_skills_ui_ux_pro_max_skill_pre_delivery_checklist [EXTRACTED 1.00]

## Communities (64 total, 36 thin omitted)

### Community 0 - "Scheduling Engine Core"
Cohesion: 0.06
Nodes (78): analyzeConflicts(), AnalyzerInput, REASON_TO_KIND, stateFromSlots(), suggestReplacements(), availability, certification, equipment (+70 more)

### Community 1 - "App Routes & Pages"
Cohesion: 0.06
Nodes (67): AnalyticsPage(), AssignmentsPage(), BoardsPage(), CalendarPage(), ConstraintsPage(), DashboardPage(), SettingsPage(), ShavzakPage() (+59 more)

### Community 2 - "Calendar & Board Views"
Cohesion: 0.08
Nodes (51): AssignmentRow, CalendarView(), makeNewValue(), Option, View, DayView(), MonthView(), TimeGrid() (+43 more)

### Community 3 - "App Shell & Layout"
Cohesion: 0.06
Nodes (43): AppLayout(), AppSidebar(), LocaleSwitcher(), RoleSwitcher(), ThemeToggle(), initials(), Topbar(), Separator() (+35 more)

### Community 4 - "Server Actions & Data Layer"
Cohesion: 0.08
Nodes (46): AssignmentFormValue, Env, parsed, schema, writeAudit(), adapter, globalForPrisma, ActionResult (+38 more)

### Community 5 - "UI/UX Skill Rules"
Cohesion: 0.07
Nodes (44): Accessibility Rules (Priority 1, CRITICAL), Animation Rules (Priority 7, MEDIUM), Charts & Data Rules (Priority 10, LOW), --design-system Generation Step, Forms & Feedback Rules (Priority 8, MEDIUM), Layout & Responsive Rules (Priority 5, HIGH), Master + Overrides Persistence Pattern, Navigation Patterns Rules (Priority 9, HIGH) (+36 more)

### Community 6 - "TypeScript Config"
Cohesion: 0.06
Nodes (32): ./*, dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+24 more)

### Community 7 - "Forms & Board Management"
Cohesion: 0.17
Nodes (21): FormInput, FormOutput, Option, BoardItem, BoardStatus, BoardStatus, STATUS_COLORS, Input() (+13 more)

### Community 8 - "Avatar & Card Primitives"
Cohesion: 0.12
Nodes (22): RankBars(), Choice(), Chip(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+14 more)

### Community 9 - "Tables & Dropdown Menus"
Cohesion: 0.14
Nodes (18): Option, ConfirmDialog(), SoldierFormValue, Option, SoldierRow, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent() (+10 more)

### Community 10 - "Buttons & Date Pickers"
Cohesion: 0.15
Nodes (20): Button(), buttonVariants, Calendar(), dateFnsLocales, DatePicker(), DatePickerProps, dayPickerLocales, dateFnsLocales (+12 more)

### Community 11 - "shadcn Registry Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 12 - "Soldier Form"
Cohesion: 0.13
Nodes (15): EMPTY, FormInput, FormOutput, Option, shiftLabel(), SoldierForm(), SoldierFormProps, SelectGroup() (+7 more)

### Community 13 - "Data Table Stack"
Cohesion: 0.23
Nodes (13): AuditPage(), AssignmentsTable(), DataTable(), DataTableProps, Table(), TableBody(), TableCaption(), TableCell() (+5 more)

### Community 14 - "Form Validation Primitives"
Cohesion: 0.19
Nodes (13): FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, FormLabel() (+5 more)

### Community 15 - "Alert Dialog Stack"
Cohesion: 0.23
Nodes (10): AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogMedia() (+2 more)

### Community 16 - "Dev Tooling Deps"
Cohesion: 0.15
Nodes (13): dotenv, eslint, devDependencies, dotenv, eslint, prettier, prisma, tailwindcss (+5 more)

### Community 17 - "Package Scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:generate, db:migrate, db:reset, db:seed, db:studio, dev (+5 more)

### Community 18 - "Root Layout & Theming"
Cohesion: 0.20
Nodes (7): fontHeading, fontMono, fontSans, RootLayout(), ThemeHotkey(), ThemeProvider(), Toaster()

### Community 19 - "React Component Consumers"
Cohesion: 0.17
Nodes (12): AssignmentForm(), asDateInput(), BoardManager(), BoardsTable(), SoldiersTable(), CalendarDayButton(), DateRangePicker(), parseDate() (+4 more)

### Community 20 - "Dialog Primitives"
Cohesion: 0.18
Nodes (6): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 21 - "Core Runtime Deps"
Cohesion: 0.22
Nodes (9): date-fns, next-intl, dependencies, date-fns, next-intl, @prisma/client, react-day-picker, @prisma/client (+1 more)

### Community 22 - "Tabs Primitives"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 23 - "Database Seeding"
Cohesion: 0.47
Nodes (5): adapter, atDay(), createAssignment(), main(), prisma

### Community 24 - "Package Metadata"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 25 - "Next.js Config"
Cohesion: 0.50
Nodes (3): nextConfig, projectRoot, withNextIntl

## Ambiguous Edges - Review These
- `Charts & Data Rules (Priority 10, LOW)` → `Shavzak Planner Page`  [AMBIGUOUS]
  .agents/skills/ui-ux-pro-max/SKILL.md · relation: conceptually_related_to
- `React Native Stack Guidelines` → `Shavzak Reserve Duty Scheduling System`  [AMBIGUOUS]
  .agents/skills/ui-ux-pro-max/SKILL.md · relation: conceptually_related_to

## Knowledge Gaps
- **206 isolated node(s):** `fontSans`, `fontHeading`, `fontMono`, `$schema`, `style` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Charts & Data Rules (Priority 10, LOW)` and `Shavzak Planner Page`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `React Native Stack Guidelines` and `Shavzak Reserve Duty Scheduling System`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `Avatar & Card Primitives` to `App Routes & Pages`, `Calendar & Board Views`, `App Shell & Layout`, `Forms & Board Management`, `Tables & Dropdown Menus`, `Buttons & Date Pickers`, `Soldier Form`, `Data Table Stack`, `Form Validation Primitives`, `Alert Dialog Stack`, `Root Layout & Theming`, `React Component Consumers`, `Dialog Primitives`, `Tabs Primitives`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Runtime Deps` to `React Component Consumers`, `Package Metadata`, `Base UI React Dep`, `CVA Styling Dep`, `clsx Dep`, `dnd-kit Core Dep`, `dnd-kit Sortable Dep`, `dnd-kit Utilities Dep`, `Hookform Resolvers Dep`, `jsPDF Dep`, `jsPDF Autotable Dep`, `Lucide Icons Dep`, `Next.js Dep`, `next-themes Dep`, `node-postgres Dep`, `Prisma PG Adapter Dep`, `React DOM Dep`, `React Hook Form Dep`, `Recharts Dep`, `shadcn CLI Dep`, `Sonner Toast Dep`, `tailwind-merge Dep`, `TanStack Table Dep`, `tw-animate-css Dep`, `xlsx Dep`, `Zod Dep`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `react` connect `React Component Consumers` to `App Routes & Pages`, `Calendar & Board Views`, `App Shell & Layout`, `Buttons & Date Pickers`, `Soldier Form`, `Data Table Stack`, `Form Validation Primitives`, `Root Layout & Theming`, `Core Runtime Deps`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **What connects `fontSans`, `fontHeading`, `fontMono` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scheduling Engine Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05521576622494054 - nodes in this community are weakly interconnected._