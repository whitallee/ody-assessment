# Ody Restaurant Dashboard

A fullstack restaurant operations dashboard built with the Ody production stack: Turborepo, Expo (React Native Web), Hono on Cloudflare Workers, Neon Postgres, Drizzle ORM, and Orval-generated API types.

**Live demo:** https://ody-dashboard-4do.pages.dev  
**API:** https://ody-backend.whitallee.workers.dev/docs

---

## Local Development

### Prerequisites

- Node 20+
- pnpm 10+ (`npm install -g pnpm`)
- A [Neon](https://neon.tech) Postgres database (free tier is fine)
- A [Cloudflare](https://cloudflare.com) account (for deployment only — not needed for local dev)

### 1. Clone and install

```bash
git clone <repo-url>
cd ody-assessment
pnpm install
```

### 2. Configure environment

Create `.env` at the repo root:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> Use the **non-pooled** URL from your Neon dashboard. `@neondatabase/serverless` manages its own connection pooling — adding Neon's pooler on top causes conflicts.

Create `services/backend/.dev.vars` (Wrangler reads this for local Workers dev):

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

A `.env.example` is included at the repo root showing the required keys.

### 3. Bootstrap the database

```bash
# Sync schema to Neon
pnpm db:push

# Seed with sample restaurant data (menu, customers, orders, reservations, rewards, loyalty)
pnpm db:seed
```

### 4. Generate the API contract

```bash
pnpm gen:contract
```

This runs two steps in sequence:

1. `gen:spec` — calls `app.getOpenAPI31Document()` on the Hono app (no server needed) and writes `services/backend/openapi.json`
2. `gen` — Orval reads that spec and generates React Query hooks + TypeScript types into `packages/api-client/src/generated/`

### 5. Start the dev servers

Open two terminals:

```bash
# Terminal 1 — Hono API on http://localhost:8787
pnpm dev:backend

# Terminal 2 — Expo web on http://localhost:8081
pnpm dev:dashboard
```

Open [http://localhost:8081](http://localhost:8081). API docs are at [http://localhost:8787/docs](http://localhost:8787/docs).

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:dashboard` | Expo web dev server |
| `pnpm dev:backend` | Cloudflare Workers dev server (Wrangler) |
| `pnpm gen:contract` | Generate OpenAPI spec + Orval React Query hooks |
| `pnpm db:push` | Sync Drizzle schema to Neon (no migration files) |
| `pnpm db:generate` | Generate a versioned migration file from schema diff |
| `pnpm db:migrate` | Apply pending migration files |
| `pnpm db:seed` | Seed with sample restaurant data |
| `pnpm db:studio` | Open Drizzle Studio (web DB GUI) |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm test` | Run all tests (vitest + jest) |
| `pnpm build` | Production build |

---

## Features

### Dashboard pages

| Page | What it does |
|------|-------------|
| **Home** | Live KPIs — revenue today, order counts by status, popular menu items, upcoming reservations |
| **Orders** | Full order list with status filters, order detail view, status transitions via state machine |
| **Menu** | Category and item management — create, edit, toggle availability |
| **CRM** | Customer list with spend and order history; Loyalty tab per customer (balance, transaction ledger, redeem rewards, adjust points) |
| **Reservations** | Booking list with date filter, status management (confirmed → seated → completed) |
| **Rewards** | Define loyalty rewards (fixed discount, percent discount, free item), set earn rate, activate/deactivate |
| **Settings** | Prep time, auto-accept, service hours, loyalty program toggle and earn rate |

### Design system

Located in `packages/shared/src/tokens.ts`. Includes color tokens (brand amber + warm gray neutrals + semantic), typography scale (Playfair Display headings, Inter body), spacing scale, radius, shadow/elevation, and z-index.

UI primitives in `apps/dashboard/components/ui/`: `Button`, `Card`, `Input`, `Select`, `Modal`, `Badge`, `Skeleton`, `Toast`, `Typography`.

Visit `/ui-library` in the running app for the full component catalog.

---

## Architecture

### Data flow

```
Drizzle schema (schema.ts)
  → drizzle-zod (validators.ts)
    → @hono/zod-openapi route definitions
      → openapi.json  (pnpm gen:contract)
        → Orval
          → packages/api-client/src/generated/   ← React Query hooks + TS types
            → apps/dashboard pages
```

Single source of truth is the Drizzle schema. Change a column → update the Zod validator → regenerate the contract → frontend types update automatically. No manually written DTOs.

### Project structure

```
apps/
  dashboard/              # Expo + React Native Web
    app/
      (dashboard)/        # Sidebar layout group
        index.tsx         # Home / KPIs
        orders/           # Order management
        crm/              # CRM + loyalty
        menu/             # Menu management
        reservations/     # Reservations
        rewards/          # Loyalty rewards catalog
        settings/         # Business settings
      ui-library/         # Design system showcase
    components/
      ui/                 # Button, Card, Input, Select, Modal, Badge, Skeleton, Toast
      layout/             # Sidebar, PageLayout
    lib/
      api.ts              # Typed API layer (stopgap until Orval hooks fully wired)
    __tests__/            # Jest utility tests

services/
  backend/                # Hono on Cloudflare Workers
    src/
      db/
        schema.ts         # Drizzle tables + enums + ORDER_TRANSITIONS state machine
        validators.ts     # drizzle-zod schemas (the API contract)
        seed.ts           # Sample data
        migrations/       # Versioned migration files
      routes/             # One file per resource
      index.ts            # App entry + OpenAPI registration
      gen-openapi.ts      # Static spec export (no live server needed)
      __tests__/          # Vitest integration tests

packages/
  shared/                 # Design tokens + utility functions
  api-client/             # Orval config + customFetch wrapper + generated hooks
  types/                  # Re-exports from api-client
```

### Key decisions

**Why Neon + non-pooled URL?**  
Cloudflare Workers runs on V8 isolates with no TCP socket support. `@neondatabase/serverless` uses HTTP for database calls — the only Postgres driver that works in Workers. It manages connection pooling internally, so the non-pooled URL is correct.

**Why drizzle-zod?**  
Derives Zod schemas directly from the Drizzle schema. Eliminates schema drift between DB and API contract. Schemas are then extended with business rules (min lengths, format validation, etc.).

**Why static spec generation?**  
`gen:contract` calls `app.getOpenAPI31Document()` on the Hono app without starting a server. CI-safe, no side effects, no "start server, wait, curl, kill" pattern.

**Why `initApiClient` instead of reading `EXPO_PUBLIC_API_URL` in `@ody/api-client`?**  
Metro only inlines `EXPO_PUBLIC_*` env vars within the Expo project root. `packages/api-client` is outside that root, so the env var is never substituted there. The fix: call `initApiClient(process.env.EXPO_PUBLIC_API_URL)` from `apps/dashboard/app/_layout.tsx`, where Metro's substitution works.

**Order state machine**  
Transitions are enforced server-side via `ORDER_TRANSITIONS` in `schema.ts`. The API rejects invalid transitions (`pending → completed`) with a 400. The dashboard only shows valid next-state actions per order.

**Loyalty points**  
Points are auto-earned when an order transitions to `completed`, calculated server-side from `settings.loyaltyPointsPerDollar × (totalCents / 100)`. Redemption deducts the reward's `pointsCost` from the customer's balance atomically.

---

## Testing

```bash
pnpm test
```

- **Backend** (`services/backend/src/__tests__/orders.test.ts`) — Vitest + mocked DB. Tests order creation validation, state machine transitions (valid and invalid), and utility routes.
- **Frontend** (`apps/dashboard/__tests__/Badge.test.tsx`) — Jest. Tests shared utility functions (`formatCurrency`, `initials`, `truncate`, `pluralize`, `formatDate`).

---

## Deployment

### Backend (Cloudflare Workers)

```bash
# Authenticate with Cloudflare (one-time)
pnpm exec wrangler login --config services/backend/wrangler.toml

# Set the database secret
pnpm exec wrangler secret put DATABASE_URL --config services/backend/wrangler.toml

# Deploy
pnpm --filter @ody/backend run deploy
```

### Dashboard (Cloudflare Pages)

```bash
# Build (bakes the production API URL in at build time)
pnpm --filter @ody/dashboard run build:web

# Deploy
pnpm exec wrangler pages deploy apps/dashboard/dist --project-name ody-dashboard
```

> For a proper multi-environment setup, remove the hardcoded URL from `build:web` and configure `EXPO_PUBLIC_API_URL` as an environment variable in the Cloudflare Pages dashboard under Settings → Environment Variables. Pages injects it at build time automatically.

---

## Design System

**Typography**
- Display / headings: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — elegant serif for brand moments
- Body / UI: [Inter](https://rsms.me/inter/) — clean, legible for dashboard use

**Color**
- Brand: warm amber (`#f59e0b` family)
- Neutrals: warm gray (`#fafaf9` background → `#1c1917` text)
- Semantic: success / warning / error / info scales

**Layout**
- 240px dark sidebar (neutral-950) with amber active indicator
- Card-based content areas on warm off-white (`#fafaf9`) background

---

## Tradeoffs & Incomplete Areas

### Intentional scope cuts

- **No auth** — internal ops tool; not in spec requirements. A production version would add Cloudflare Access or JWT middleware.
- **No pagination UI** — API supports `limit`/`offset` but the dashboard loads all records and relies on backend defaults.
- **No image upload** — `imageUrl` field exists; create/edit modal accepts a URL string. Production would use Cloudflare R2 + presigned uploads.
- **Native** — components use RN primitives so native would work structurally, but layouts are web-optimized and untested on device.

### Known rough edges

- Dashboard pages use the hand-written `lib/api.ts` layer rather than Orval-generated hooks. The generated hooks exist in `packages/api-client/src/generated/` and are exported — wiring them in is mechanical but not done for all pages.
- `db:push` is used for schema sync rather than versioned migrations. Fast for development; a production app should use `db:generate` + `db:migrate`.
- Wrangler local dev reads from `.dev.vars`. First-time setup requires creating that file manually (see step 2 above).

### What I'd add with more time

- Wire Orval-generated React Query hooks into all dashboard pages
- E2E tests with Playwright
- Optimistic updates on order status changes
- Real-time order updates via Cloudflare Durable Objects or SSE
- Customer search and filter in CRM
- Menu item drag-to-reorder (schema already has `sortOrder`)
- Proper multi-environment CI/CD with staging + production Pages deployments
