import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { eq, desc, gte, sql } from 'drizzle-orm';
import type { Env } from '../index';
import { orders, orderItems, menuItems } from '../db/schema';
import { HomeStatsSchema } from '../db/validators';

export const homeRoutes = new OpenAPIHono<Env>();

homeRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/stats',
    tags: ['Home'],
    summary: 'Get dashboard KPI summary',
    responses: {
      200: {
        content: { 'application/json': { schema: HomeStatsSchema } },
        description: 'KPI stats for the dashboard home page',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      [{ totalOrdersToday, revenueToday }],
      [{ totalOrdersAllTime, revenueAllTime }],
      [{ pendingOrders }],
      popularItemsRaw,
      recentOrders,
      ordersByStatusRaw,
    ] = await Promise.all([
      db
        .select({
          totalOrdersToday: sql<number>`count(*)::int`,
          revenueToday: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        })
        .from(orders)
        .where(gte(orders.createdAt, todayStart)),

      db
        .select({
          totalOrdersAllTime: sql<number>`count(*)::int`,
          revenueAllTime: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        })
        .from(orders),

      db
        .select({ pendingOrders: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.status, 'pending')),

      db
        .select({
          menuItemId: orderItems.menuItemId,
          name: menuItems.name,
          orderCount: sql<number>`count(*)::int`,
          revenueCents: sql<number>`sum(${orderItems.subtotalCents})::int`,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
        .groupBy(orderItems.menuItemId, menuItems.name)
        .orderBy(desc(sql`count(*)`))
        .limit(5),

      db.query.orders.findMany({
        with: { customer: true, items: { with: { menuItem: true } } },
        orderBy: [desc(orders.createdAt)],
        limit: 5,
      }),

      db
        .select({
          status: orders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .groupBy(orders.status),
    ]);

    const ordersByStatus = Object.fromEntries(
      ordersByStatusRaw.map((row) => [row.status, row.count]),
    );

    return c.json(
      {
        totalOrdersToday,
        revenueToday,
        pendingOrders,
        totalOrdersAllTime,
        revenueAllTime,
        popularItems: popularItemsRaw,
        recentOrders,
        ordersByStatus,
      },
      200,
    );
  },
);
