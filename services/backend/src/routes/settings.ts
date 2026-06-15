import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import type { Env } from '../index';
import { settings } from '../db/schema';
import { SettingsSchema, UpdateSettingsSchema } from '../db/validators';

export const settingsRoutes = new OpenAPIHono<Env>();

async function getOrCreateSettings(db: ReturnType<typeof import('../db').createDb>) {
  const existing = await db.query.settings.findFirst();
  if (existing) return existing;
  const [created] = await db.insert(settings).values({}).returning();
  return created;
}

// ─── GET / ────────────────────────────────────────────────────────────────────

settingsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Settings'],
    summary: 'Get restaurant settings',
    responses: {
      200: {
        content: { 'application/json': { schema: SettingsSchema } },
        description: 'Current restaurant settings',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const row = await getOrCreateSettings(db);
    return c.json(row, 200);
  },
);

// ─── PUT / ────────────────────────────────────────────────────────────────────

settingsRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/',
    tags: ['Settings'],
    summary: 'Update restaurant settings',
    request: {
      body: {
        content: { 'application/json': { schema: UpdateSettingsSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: SettingsSchema } },
        description: 'Updated settings',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');
    const existing = await getOrCreateSettings(db);
    const [row] = await db
      .update(settings)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ ...body, openingHours: body.openingHours as any, updatedAt: new Date() })
      .where(eq(settings.id, existing.id))
      .returning();
    return c.json(row, 200);
  },
);
