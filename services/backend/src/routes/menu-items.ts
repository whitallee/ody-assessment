import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq, asc, and } from 'drizzle-orm';
import type { Env } from '../index';
import { menuItems } from '../db/schema';
import {
  MenuItemSchema,
  MenuItemWithCategorySchema,
  CreateMenuItemSchema,
  UpdateMenuItemSchema,
  ReorderMenuItemsSchema,
} from '../db/validators';

export const menuItemsRoutes = new OpenAPIHono<Env>();

// ─── GET / ────────────────────────────────────────────────────────────────────

menuItemsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Menu Items'],
    summary: 'List menu items',
    request: {
      query: z.object({
        categoryId: z.string().uuid().optional(),
        available: z.enum(['true', 'false']).optional(),
      }),
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.array(MenuItemWithCategorySchema) } },
        description: 'List of menu items with their categories',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { categoryId, available } = c.req.valid('query');
    const rows = await db.query.menuItems.findMany({
      with: { category: true },
      where: and(
        categoryId ? eq(menuItems.categoryId, categoryId) : undefined,
        available !== undefined ? eq(menuItems.isAvailable, available === 'true') : undefined,
      ),
      orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
    });
    return c.json(rows, 200);
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

menuItemsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Menu Items'],
    summary: 'Get a menu item by ID',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: MenuItemWithCategorySchema } },
        description: 'Menu item with category',
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
    const row = await db.query.menuItems.findFirst({
      with: { category: true },
      where: eq(menuItems.id, id),
    });
    if (!row) return c.json({ error: 'Menu item not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

menuItemsRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Menu Items'],
    summary: 'Create a menu item',
    request: {
      body: {
        content: { 'application/json': { schema: CreateMenuItemSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: MenuItemSchema } },
        description: 'Created menu item',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');
    const [row] = await db.insert(menuItems).values(body).returning();
    return c.json(row, 201);
  },
);

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

menuItemsRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Menu Items'],
    summary: 'Update a menu item',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateMenuItemSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: MenuItemSchema } },
        description: 'Updated menu item',
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
      .update(menuItems)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    if (!row) return c.json({ error: 'Menu item not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── PATCH /reorder ───────────────────────────────────────────────────────────

menuItemsRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/reorder',
    tags: ['Menu Items'],
    summary: 'Batch-update sortOrder for menu items',
    request: {
      body: {
        content: { 'application/json': { schema: ReorderMenuItemsSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
        description: 'Sort orders updated',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const items = c.req.valid('json');
    await Promise.all(
      items.map(({ id, sortOrder }) =>
        db.update(menuItems).set({ sortOrder }).where(eq(menuItems.id, id)),
      ),
    );
    return c.json({ success: true }, 200);
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

menuItemsRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Menu Items'],
    summary: 'Delete a menu item',
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
    const [row] = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    if (!row) return c.json({ error: 'Menu item not found' }, 404);
    return c.json({ success: true }, 200);
  },
);
