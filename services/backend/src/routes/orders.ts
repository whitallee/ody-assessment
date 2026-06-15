import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import type { Env } from '../index';
import { orders, orderItems, menuItems } from '../db/schema';
import { ORDER_TRANSITIONS } from '../db/schema';
import {
  OrderWithDetailsSchema,
  CreateOrderSchema,
  UpdateOrderStatusSchema,
} from '../db/validators';

export const ordersRoutes = new OpenAPIHono<Env>();

// ─── GET / ────────────────────────────────────────────────────────────────────

ordersRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Orders'],
    summary: 'List orders with optional filters',
    request: {
      query: z.object({
        status: z
          .enum(['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'])
          .optional(),
        customerId: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional().default(50),
        offset: z.coerce.number().int().min(0).optional().default(0),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(OrderWithDetailsSchema),
              total: z.number().int(),
            }),
          },
        },
        description: 'Paginated list of orders',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { status, customerId, limit, offset } = c.req.valid('query');

    const where = and(
      status ? eq(orders.status, status) : undefined,
      customerId ? eq(orders.customerId, customerId) : undefined,
    );

    const [rows, [{ count }]] = await Promise.all([
      db.query.orders.findMany({
        with: { customer: true, items: { with: { menuItem: true } } },
        where,
        orderBy: [desc(orders.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
    ]);

    return c.json({ data: rows, total: count }, 200);
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

ordersRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Orders'],
    summary: 'Get order details',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: OrderWithDetailsSchema } },
        description: 'Order with items and customer',
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
    const row = await db.query.orders.findFirst({
      with: { customer: true, items: { with: { menuItem: true } } },
      where: eq(orders.id, id),
    });
    if (!row) return c.json({ error: 'Order not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

ordersRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Orders'],
    summary: 'Create a new order',
    request: {
      body: {
        content: { 'application/json': { schema: CreateOrderSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: OrderWithDetailsSchema } },
        description: 'Created order',
      },
      422: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Business rule violation (unavailable items, etc.)',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');

    const menuItemIds = body.items.map((i) => i.menuItemId);
    const foundItems = await db.query.menuItems.findMany({
      where: inArray(menuItems.id, menuItemIds),
    });

    if (foundItems.length !== menuItemIds.length) {
      return c.json({ error: 'One or more menu items do not exist' }, 422);
    }

    const unavailable = foundItems.filter((item) => !item.isAvailable);
    if (unavailable.length > 0) {
      return c.json(
        {
          error: `The following items are unavailable: ${unavailable.map((i) => i.name).join(', ')}`,
        },
        422,
      );
    }

    const itemMap = new Map(foundItems.map((item) => [item.id, item]));
    const lineItems = body.items.map((reqItem) => {
      const menuItem = itemMap.get(reqItem.menuItemId)!;
      return {
        menuItemId: reqItem.menuItemId,
        quantity: reqItem.quantity,
        unitPriceCents: menuItem.priceCents,
        subtotalCents: menuItem.priceCents * reqItem.quantity,
      };
    });

    const totalCents = lineItems.reduce((sum, item) => sum + item.subtotalCents, 0);

    const [order] = await db
      .insert(orders)
      .values({
        customerId: body.customerId ?? null,
        totalCents,
        notes: body.notes ?? null,
        status: 'pending',
      })
      .returning();

    await db
      .insert(orderItems)
      .values(lineItems.map((item) => ({ ...item, orderId: order.id })));

    const fullOrder = await db.query.orders.findFirst({
      with: { customer: true, items: { with: { menuItem: true } } },
      where: eq(orders.id, order.id),
    });

    return c.json(fullOrder!, 201);
  },
);

// ─── PATCH /:id/status ────────────────────────────────────────────────────────

ordersRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/status',
    tags: ['Orders'],
    summary: 'Advance order status through valid transitions',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateOrderStatusSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: OrderWithDetailsSchema } },
        description: 'Updated order',
      },
      400: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Invalid status transition',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Order not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const { status: newStatus } = c.req.valid('json');

    const existing = await db.query.orders.findFirst({ where: eq(orders.id, id) });
    if (!existing) return c.json({ error: 'Order not found' }, 404);

    const allowedTransitions = ORDER_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(newStatus)) {
      return c.json(
        {
          error: `Cannot transition from '${existing.status}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
        },
        400,
      );
    }

    const [updated] = await db
      .update(orders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    const fullOrder = await db.query.orders.findFirst({
      with: { customer: true, items: { with: { menuItem: true } } },
      where: eq(orders.id, updated.id),
    });

    return c.json(fullOrder!, 200);
  },
);
