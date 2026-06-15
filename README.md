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

```bash
cp .env.example .env
```

Edit `.env` with your Neon connection strings:
```env
# Direct URL (non-pooled) — for Drizzle migrations
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Pooled URL — used by Cloudflare Workers at runtime
DATABASE_URL_POOLED=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Local dev API URL
EXPO_PUBLIC_API_URL=http://localhost:8787
```

Also create `services/backend/.dev.vars` (Wrangler reads this for local dev):
```env
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> Use the **pooled** URL in `.dev.vars` — it's the one with `-pooler` in the hostname.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

```bash
# Push schema to Neon (creates all tables)
pnpm db:migrate

# Seed with sample restaurant data
pnpm db:seed
```

### 4. Generate API Contract

```bash
# Backend must be running OR use the static spec generator:
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

> API docs are available at [http://localhost:8787/docs](http://localhost:8787/docs)

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:dashboard` | Start Expo web dev server |
| `pnpm dev:backend` | Start Cloudflare Workers dev server |
| `pnpm gen:contract` | Generate OpenAPI spec + Orval hooks |
| `pnpm db:migrate` | Run Drizzle migrations against Neon |
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
      ui-library/      # Design system showcase
    components/
      ui/              # Primitives: Button, Card, Badge, Input, Modal, Toast, Skeleton
      layout/          # Sidebar, PageLayout
      features/        # Domain-specific components
    lib/
      api.ts           # Typed API layer (replaced by Orval output post-codegen)

services/
  backend/             # Hono on Cloudflare Workers
    src/
      db/
        schema.ts      # Drizzle table definitions + relations + enums
        validators.ts  # drizzle-zod schemas (the API contract)
        seed.ts        # Sample data seed script
      routes/          # One file per resource
      index.ts         # Hono app entry + OpenAPI registration
      gen-openapi.ts   # Static spec export script (no live server needed)

packages/
  shared/              # Design tokens + utility functions
  api-client/          # Orval config + custom fetch wrapper
  types/               # Re-exports from api-client
```

### Key Decisions

**Why Neon?**
Cloudflare Workers runs on V8 isolates with no TCP socket support. Neon's `@neondatabase/serverless` uses HTTP for database calls, making it the only Postgres driver that works in Workers without an intermediary (Hyperdrive, etc.).

**Why drizzle-zod?**
Instead of manually writing Zod schemas that match the DB shape, `drizzle-zod` derives them automatically. This eliminates an entire class of schema drift bugs. The derived schemas are then extended with business rules (min lengths, format validation, etc.).

**Why static spec generation (not live-server codegen)?**
`gen:contract` uses `app.getOpenAPI31Document()` on the Hono app without starting a server. This lets codegen run in CI without side effects and avoids the "start server, wait, curl, kill" pattern.

**Why Expo Router over a plain SPA?**
The assessment specifies Expo + React Native + Web. Expo Router provides file-based routing on both web and native from a single codebase. The web output is a standard bundle that deploys to Cloudflare Pages.

**Design token strategy**
All design values (color, spacing, typography, shadow) live in `packages/shared/src/tokens.ts`. Components import from there rather than using raw values. The UI Library page at `/ui-library` renders the full token set as a living reference.

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
# Set production secret
wrangler secret put DATABASE_URL
# (paste your pooled Neon URL when prompted)

# Deploy
pnpm --filter @ody/backend deploy
```

### Dashboard (Cloudflare Pages)

```bash
# Build Expo web output
pnpm --filter @ody/dashboard build:web

# Deploy to Pages (first time: create project via dashboard)
npx wrangler pages deploy apps/dashboard/dist
```

Set `EXPO_PUBLIC_API_URL` to your deployed Workers URL in the Cloudflare Pages environment variables.

---

## Tradeoffs & Incomplete Areas

### Intentional scope cuts
- **No authentication** — the assessment is an internal ops dashboard and auth was not listed as a requirement. A production version would add Cloudflare Access or a JWT middleware.
- **No pagination UI** — the API supports `limit`/`offset` params, but the dashboard currently loads everything and relies on backend limiting defaults.
- **No image upload** — menu items have an `imageUrl` field but the create/edit modal accepts a URL string, not a file upload. A production version would add Cloudflare R2 + presigned upload.
- **Native readiness** — the assessment marks this as "bonus". Components use React Native primitives so native would work structurally, but layouts aren't tested on device. The font loading and StyleSheet approach is cross-platform.

### Known rough edges
- The Orval-generated hooks in `packages/api-client/src/generated/` don't exist until `pnpm gen:contract` is run. The dashboard uses a hand-written `lib/api.ts` as a stopgap that matches the same interface. After codegen, pages should import from `@ody/api-client` directly.
- Wrangler local dev uses a mock `[vars]` section for the environment name but reads secrets from `.dev.vars`. First-time setup requires creating that file manually (documented above).
- TypeScript strict mode is enabled across all packages. The `@cloudflare/workers-types` and `expo/tsconfig.base` have some minor conflicts that are suppressed with `skipLibCheck`.

### What I'd add with more time
- Drizzle migrations versioned in `/migrations` (currently using `db:push` for speed)
- E2E tests with Playwright
- Optimistic updates on status changes (currently waits for server response)
- Real-time order updates via Cloudflare Durable Objects or Server-Sent Events
- Menu item drag-to-reorder (already have `sortOrder` in schema)
- Customer search/filter on the CRM page
