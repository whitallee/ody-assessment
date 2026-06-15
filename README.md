# Ody Restaurant Dashboard

A fullstack restaurant operations dashboard built with the Ody production stack: Turborepo, Expo (React Native Web), Hono on Cloudflare Workers, Neon Postgres, Drizzle ORM, and Orval-generated API types.

---

## Quick Start

### Prerequisites

- pnpm 10+
- Node 20+
- Wrangler CLI (`pnpm add -g wrangler`)
- Neon Postgres account (https://neon.tech)
- Cloudflare account

### 1. Environment Setup

Create a `.env` file at the monorepo root:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Use the **non-pooled** URL. `@neondatabase/serverless` manages its own connection pooling over HTTP — adding Neon's pooler on top is redundant and can cause issues.

Also create `services/backend/.dev.vars` (Wrangler reads this for local dev):
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

```bash
# Push schema to Neon (creates all tables directly — no migration files needed)
pnpm db:push

# Seed with sample restaurant data
pnpm db:seed
```

> `db:push` syncs the Drizzle schema directly to the database. For a production app with multiple environments, use `db:generate` + `db:migrate` to version migrations in source control.

### 4. Generate API Contract

```bash
pnpm gen:contract
```

This runs two steps:
1. `gen:spec` — exports `services/backend/openapi.json` from the Hono app (no live server needed)
2. `gen` (Orval) — reads `openapi.json` and generates React Query hooks + types into `packages/api-client/src/generated/`

### 5. Start Development

```bash
# In two separate terminals:
pnpm dev:backend    # Wrangler dev server at http://localhost:8787
pnpm dev:dashboard  # Expo web at http://localhost:8081
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

> API docs available at [http://localhost:8787/docs](http://localhost:8787/docs)

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:dashboard` | Start Expo web dev server |
| `pnpm dev:backend` | Start Cloudflare Workers dev server |
| `pnpm gen:contract` | Generate OpenAPI spec + Orval hooks |
| `pnpm db:push` | Sync Drizzle schema to Neon (direct, no migration files) |
| `pnpm db:migrate` | Apply versioned migrations (requires `db:generate` first) |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm test` | Run all tests |
| `pnpm build` | Build all packages |

---

## Architecture

### Data Flow

```
Drizzle schema (schema.ts)
  → drizzle-zod (validators.ts)
    → @hono/zod-openapi (route definitions)
      → openapi.json (gen:spec)
        → Orval (gen)
          → packages/api-client/src/generated/
            → apps/dashboard pages (via useQuery / useMutation)
```

This means:
- **Single source of truth**: the Drizzle schema. Change a column → change the Zod validator → change the API contract → regenerate frontend types
- **No handwritten DTOs**: frontend types are always derived from the backend schema
- **No type drift**: Orval regenerates on every `gen:contract` run

### Project Structure

```
apps/
  dashboard/           # Expo + React Native Web
    app/               # Expo Router pages
      (dashboard)/     # Main dashboard group (sidebar layout)
        index.tsx      # Home / KPIs
        orders/        # Orders list + status management
        crm/           # Customer relationship management
        menu/          # Menu categories and items
        settings/      # Business settings
    components/
      ui/              # Primitives: Button, Card, Badge, Input, Modal, Toast, Skeleton
      layout/          # Sidebar, PageLayout
      features/        # Domain-specific components
    lib/
      api.ts           # Hand-written typed API layer (stopgap until Orval hooks are wired in)

services/
  backend/             # Hono on Cloudflare Workers
    src/
      db/
        schema.ts      # Drizzle table definitions + relations + enums + ORDER_TRANSITIONS
        validators.ts  # drizzle-zod schemas (the API contract)
        seed.ts        # Sample data seed script
      routes/          # One file per resource
      index.ts         # Hono app entry + OpenAPI registration
      gen-openapi.ts   # Static spec export script (no live server needed)

packages/
  shared/              # Design tokens + utility functions
  api-client/          # Orval config + custom fetch wrapper + generated hooks
  types/               # Re-exports from api-client
```

### Key Decisions

**Why Neon + non-pooled URL?**
Cloudflare Workers runs on V8 isolates with no TCP socket support. Neon's `@neondatabase/serverless` uses HTTP for database calls, making it the only Postgres driver that works in Workers without an intermediary. It manages its own connection pooling internally, so the non-pooled URL is correct — adding Neon's PgBouncer pooler on top causes conflicts.

**Why drizzle-zod?**
Instead of manually writing Zod schemas that match the DB shape, `drizzle-zod` derives them automatically. This eliminates an entire class of schema drift bugs. The derived schemas are then extended with business rules (min lengths, format validation, etc.).

**Why static spec generation (not live-server codegen)?**
`gen:contract` uses `app.getOpenAPI31Document()` on the Hono app without starting a server. This lets codegen run in CI without side effects and avoids the "start server, wait, curl, kill" pattern.

**Why `initApiClient` instead of reading `EXPO_PUBLIC_API_URL` in the package?**
Metro only inlines `EXPO_PUBLIC_*` env vars for files within the Expo project root (`apps/dashboard`). The `packages/api-client` fetcher lives outside that root, so `process.env.EXPO_PUBLIC_API_URL` would never be replaced. The fix: call `initApiClient(process.env.EXPO_PUBLIC_API_URL)` from the root layout inside the Expo project, where Metro's substitution works correctly.

**Why Expo Router over a plain SPA?**
The assessment specifies Expo + React Native + Web. Expo Router provides file-based routing on both web and native from a single codebase. The web output is a standard static bundle that deploys to Cloudflare Pages.

**Order status state machine**
Order status transitions are enforced server-side via `ORDER_TRANSITIONS` in `schema.ts`. The API rejects invalid transitions (e.g., `completed → pending`) with a 400. The frontend only shows valid next-state actions based on the current status.

**Design token strategy**
All design values (color, spacing, typography, shadow) live in `packages/shared/src/tokens.ts`. Components import from there rather than using raw values.

---

## Design System

**Typography**
- Display/headings: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — elegant serif for brand moments
- Body/UI: [Inter](https://rsms.me/inter/) — clean, highly legible for dashboard use

**Color palette**
- Brand: warm amber (#f59e0b family)
- Neutrals: warm gray (#fafaf9 background → #1c1917 text)
- Semantic: standard success/warning/error/info

**Layout**
- Card-based: each feature lives in its own `<Card>` surface
- Sidebar: 240px dark sidebar (neutral-950) with amber active state
- Content: warm off-white (#fafaf9) background

---

## Deployment

### Backend (Cloudflare Workers)

```bash
# Set the database secret (use non-pooled Neon URL)
wrangler secret put DATABASE_URL --config services/backend/wrangler.toml

# Deploy
pnpm --filter @ody/backend run deploy
```

Live at: `https://ody-backend.whitallee.workers.dev`

### Dashboard (Cloudflare Pages)

The production API URL is baked in at build time via the `build:web` script:

```bash
# Build (EXPO_PUBLIC_API_URL is set inline in the build script)
pnpm --filter @ody/dashboard run build:web

# Deploy
wrangler pages deploy apps/dashboard/dist --project-name ody-dashboard
```

Live at: `https://ody-dashboard-4do.pages.dev`

> For a proper multi-environment setup, remove the hardcoded URL from `build:web` and set `EXPO_PUBLIC_API_URL` as an environment variable in the Cloudflare Pages dashboard under Settings → Environment Variables. Pages injects it at build time automatically.

---

## Tradeoffs & Incomplete Areas

### Intentional scope cuts
- **No authentication** — the assessment is an internal ops dashboard and auth was not listed as a requirement. A production version would add Cloudflare Access or a JWT middleware.
- **No pagination UI** — the API supports `limit`/`offset` params, but the dashboard currently loads everything and relies on backend limiting defaults.
- **No image upload** — menu items have an `imageUrl` field but the create/edit modal accepts a URL string, not a file upload. A production version would add Cloudflare R2 + presigned upload.
- **Native readiness** — components use React Native primitives so native would work structurally, but layouts are optimized for web and haven't been tested on device.

### Known rough edges
- Dashboard pages currently use the hand-written `lib/api.ts` instead of the Orval-generated hooks from `packages/api-client/src/generated/`. The generated hooks exist and are exported — wiring them into each page is the next step.
- Drizzle is using `db:push` (direct schema sync) rather than versioned migrations. Fast for development, but a production app should use `db:generate` + `db:migrate` so schema history is tracked in source control.
- Wrangler local dev reads secrets from `.dev.vars`. First-time setup requires creating that file manually (documented above).

### What I'd add with more time
- Wire Orval-generated React Query hooks into all dashboard pages
- Drizzle migrations versioned in source control
- E2E tests with Playwright
- Optimistic updates on order status changes
- Real-time order updates via Cloudflare Durable Objects or Server-Sent Events
- Menu item drag-to-reorder (schema already has `sortOrder` column)
- Customer search and filter on the CRM page
