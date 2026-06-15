import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq, desc, sql } from 'drizzle-orm';
import type { Env } from '../index';
import { customers, orders } from '../db/schema';
import {
  CustomerSchema,
  CustomerWithStatsSchema,
  CreateCustomerSchema,
  UpdateCustomerSchema,
  OrderWithDetailsSchema,
} from '../db/validators';

export const customersRoutes = new OpenAPIHono<Env>();

// ─── GET / ────────────────────────────────────────────────────────────────────

customersRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Customers'],
    summary: 'List customers with order stats',
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).optional().default(50),
        offset: z.coerce.number().int().min(0).optional().default(0),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(CustomerWithStatsSchema),
              total: z.number().int(),
            }),
          },
        },
        description: 'Customers with order statistics',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { limit, offset } = c.req.valid('query');

    const [rows, [{ count }]] = await Promise.all([
      db
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          notes: customers.notes,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
          orderCount: sql<number>`count(${orders.id})::int`,
          totalSpentCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
          lastOrderAt: sql<string | null>`max(${orders.createdAt})`,
        })
        .from(customers)
        .leftJoin(orders, eq(orders.customerId, customers.id))
        .groupBy(customers.id)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(customers),
    ]);

    return c.json({ data: rows, total: count }, 200);
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

customersRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Customers'],
    summary: 'Get customer with order history',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: CustomerWithStatsSchema.extend({
              recentOrders: z.array(OrderWithDetailsSchema),
            }),
          },
        },
        description: 'Customer details with recent orders',
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

    const [statsRow] = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        notes: customers.notes,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        orderCount: sql<number>`count(${orders.id})::int`,
        totalSpentCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        lastOrderAt: sql<string | null>`max(${orders.createdAt})`,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(eq(customers.id, id))
      .groupBy(customers.id);

    if (!statsRow) return c.json({ error: 'Customer not found' }, 404);

    const recentOrders = await db.query.orders.findMany({
      with: { customer: true, items: { with: { menuItem: true } } },
      where: eq(orders.customerId, id),
      orderBy: [desc(orders.createdAt)],
      limit: 10,
    });

    return c.json({ ...statsRow, recentOrders }, 200);
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

customersRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Customers'],
    summary: 'Create a customer',
    request: {
      body: {
        content: { 'application/json': { schema: CreateCustomerSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: CustomerSchema } },
        description: 'Created customer',
      },
      409: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Email already exists',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');
    try {
      const [row] = await db.insert(customers).values(body).returning();
      return c.json(row, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('customers_email_unique')) {
        return c.json({ error: 'A customer with this email already exists' }, 409);
      }
      throw err;
    }
  },
);

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

customersRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Customers'],
    summary: 'Update a customer',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateCustomerSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: CustomerSchema } },
        description: 'Updated customer',
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
      .update(customers)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!row) return c.json({ error: 'Customer not found' }, 404);
    return c.json(row, 200);
  },
);
