import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import type { Env } from '../index';
import { rewards } from '../db/schema';
import {
  RewardWithMenuItemSchema,
  CreateRewardSchema,
  UpdateRewardSchema,
} from '../db/validators';

export const rewardsRoutes = new OpenAPIHono<Env>();

// ─── GET / ────────────────────────────────────────────────────────────────────

rewardsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Rewards'],
    summary: 'List all reward definitions',
    request: {
      query: z.object({
        active: z.coerce.boolean().optional(),
      }),
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.array(RewardWithMenuItemSchema) } },
        description: 'Reward definitions',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { active } = c.req.valid('query');

    const rows = await db.query.rewards.findMany({
      with: { menuItem: { columns: { id: true, name: true } } },
      where: active !== undefined ? eq(rewards.isActive, active) : undefined,
      orderBy: rewards.pointsCost,
    });

    return c.json(rows, 200);
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

rewardsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Rewards'],
    summary: 'Get a reward definition',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: RewardWithMenuItemSchema } },
        description: 'Reward',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const row = await db.query.rewards.findFirst({
      with: { menuItem: { columns: { id: true, name: true } } },
      where: eq(rewards.id, id),
    });
    if (!row) return c.json({ error: 'Reward not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

rewardsRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Rewards'],
    summary: 'Create a reward definition',
    request: {
      body: {
        content: { 'application/json': { schema: CreateRewardSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: RewardWithMenuItemSchema } },
        description: 'Created reward',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');
    const [row] = await db.insert(rewards).values(body).returning();
    const full = await db.query.rewards.findFirst({
      with: { menuItem: { columns: { id: true, name: true } } },
      where: eq(rewards.id, row.id),
    });
    return c.json(full!, 201);
  },
);

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

rewardsRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Rewards'],
    summary: 'Update a reward definition',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateRewardSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: RewardWithMenuItemSchema } },
        description: 'Updated reward',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const existing = await db.query.rewards.findFirst({ where: eq(rewards.id, id) });
    if (!existing) return c.json({ error: 'Reward not found' }, 404);
    await db.update(rewards).set({ ...body, updatedAt: new Date() }).where(eq(rewards.id, id));
    const full = await db.query.rewards.findFirst({
      with: { menuItem: { columns: { id: true, name: true } } },
      where: eq(rewards.id, id),
    });
    return c.json(full!, 200);
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

rewardsRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Rewards'],
    summary: 'Delete a reward definition',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
        description: 'Deleted',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const existing = await db.query.rewards.findFirst({ where: eq(rewards.id, id) });
    if (!existing) return c.json({ error: 'Reward not found' }, 404);
    await db.delete(rewards).where(eq(rewards.id, id));
    return c.json({ success: true }, 200);
  },
);
