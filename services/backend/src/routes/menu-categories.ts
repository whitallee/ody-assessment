import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq, asc } from 'drizzle-orm';
import type { Env } from '../index';
import { menuCategories } from '../db/schema';
import {
  MenuCategorySchema,
  CreateMenuCategorySchema,
  UpdateMenuCategorySchema,
} from '../db/validators';

export const menuCategoriesRoutes = new OpenAPIHono<Env>();

// ─── GET / ────────────────────────────────────────────────────────────────────

menuCategoriesRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Menu Categories'],
    summary: 'List all menu categories',
    responses: {
      200: {
        content: { 'application/json': { schema: z.array(MenuCategorySchema) } },
        description: 'List of menu categories',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const rows = await db.query.menuCategories.findMany({
      orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
    });
    return c.json(rows, 200);
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

menuCategoriesRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Menu Categories'],
    summary: 'Get a menu category by ID',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: MenuCategorySchema } },
        description: 'Menu category',
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
    const row = await db.query.menuCategories.findFirst({
      where: eq(menuCategories.id, id),
    });
    if (!row) return c.json({ error: 'Category not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

menuCategoriesRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Menu Categories'],
    summary: 'Create a menu category',
    request: {
      body: {
        content: { 'application/json': { schema: CreateMenuCategorySchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: MenuCategorySchema } },
        description: 'Created category',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');
    const [row] = await db.insert(menuCategories).values(body).returning();
    return c.json(row, 201);
  },
);

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

menuCategoriesRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Menu Categories'],
    summary: 'Update a menu category',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateMenuCategorySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: MenuCategorySchema } },
        description: 'Updated category',
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
    const [row] = await db
      .update(menuCategories)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(menuCategories.id, id))
      .returning();
    if (!row) return c.json({ error: 'Category not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

menuCategoriesRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Menu Categories'],
    summary: 'Delete a menu category',
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
    const [row] = await db.delete(menuCategories).where(eq(menuCategories.id, id)).returning();
    if (!row) return c.json({ error: 'Category not found' }, 404);
    return c.json({ success: true }, 200);
  },
);
