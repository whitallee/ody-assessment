import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq, desc, sql } from 'drizzle-orm';
import type { Env } from '../index';
import { loyaltyTransactions, rewards, customers } from '../db/schema';
import {
  LoyaltyBalanceSchema,
  LoyaltyTransactionWithDetailsSchema,
  EarnPointsSchema,
  RedeemRewardSchema,
  AdjustPointsSchema,
} from '../db/validators';

export const loyaltyRoutes = new OpenAPIHono<Env>();

async function getBalance(db: ReturnType<typeof import('../db').createDb>, customerId: string) {
  const [row] = await db
    .select({
      pointsBalance: sql<number>`coalesce(sum(${loyaltyTransactions.points}), 0)::int`,
      totalEarned: sql<number>`coalesce(sum(case when ${loyaltyTransactions.points} > 0 then ${loyaltyTransactions.points} else 0 end), 0)::int`,
      totalRedeemed: sql<number>`coalesce(sum(case when ${loyaltyTransactions.points} < 0 then abs(${loyaltyTransactions.points}) else 0 end), 0)::int`,
    })
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.customerId, customerId));
  return row;
}

// ─── GET /:customerId ─────────────────────────────────────────────────────────

loyaltyRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{customerId}',
    tags: ['Loyalty'],
    summary: 'Get loyalty balance and transaction history for a customer',
    request: { params: z.object({ customerId: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: LoyaltyBalanceSchema } },
        description: 'Customer loyalty balance and history',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Customer not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { customerId } = c.req.valid('param');

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });
    if (!customer) return c.json({ error: 'Customer not found' }, 404);

    const [balance, transactions] = await Promise.all([
      getBalance(db, customerId),
      db.query.loyaltyTransactions.findMany({
        with: { reward: { columns: { id: true, name: true } } },
        where: eq(loyaltyTransactions.customerId, customerId),
        orderBy: [desc(loyaltyTransactions.createdAt)],
        limit: 50,
      }),
    ]);

    return c.json({ customerId, ...balance, transactions }, 200);
  },
);

// ─── POST /:customerId/earn ───────────────────────────────────────────────────

loyaltyRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/{customerId}/earn',
    tags: ['Loyalty'],
    summary: 'Manually grant points to a customer',
    request: {
      params: z.object({ customerId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: EarnPointsSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: LoyaltyTransactionWithDetailsSchema } },
        description: 'Points earned',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Customer not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { customerId } = c.req.valid('param');
    const { points, description, orderId } = c.req.valid('json');

    const customer = await db.query.customers.findFirst({ where: eq(customers.id, customerId) });
    if (!customer) return c.json({ error: 'Customer not found' }, 404);

    const [tx] = await db
      .insert(loyaltyTransactions)
      .values({ customerId, points, description, type: 'earn', orderId: orderId ?? null })
      .returning();

    const full = await db.query.loyaltyTransactions.findFirst({
      with: { reward: { columns: { id: true, name: true } } },
      where: eq(loyaltyTransactions.id, tx.id),
    });

    return c.json(full!, 201);
  },
);

// ─── POST /:customerId/redeem ─────────────────────────────────────────────────

loyaltyRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/{customerId}/redeem',
    tags: ['Loyalty'],
    summary: 'Redeem a reward for a customer',
    request: {
      params: z.object({ customerId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: RedeemRewardSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: LoyaltyTransactionWithDetailsSchema } },
        description: 'Reward redeemed',
      },
      400: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Insufficient points or inactive reward',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Customer or reward not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { customerId } = c.req.valid('param');
    const { rewardId } = c.req.valid('json');

    const [customer, reward, balance] = await Promise.all([
      db.query.customers.findFirst({ where: eq(customers.id, customerId) }),
      db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
      getBalance(db, customerId),
    ]);

    if (!customer) return c.json({ error: 'Customer not found' }, 404);
    if (!reward) return c.json({ error: 'Reward not found' }, 404);
    if (!reward.isActive) return c.json({ error: 'Reward is no longer active' }, 400);
    if (balance.pointsBalance < reward.pointsCost) {
      return c.json(
        { error: `Insufficient points. Need ${reward.pointsCost}, have ${balance.pointsBalance}` },
        400,
      );
    }

    const [tx] = await db
      .insert(loyaltyTransactions)
      .values({
        customerId,
        rewardId,
        type: 'redeem',
        points: -reward.pointsCost,
        description: `Redeemed: ${reward.name}`,
      })
      .returning();

    const full = await db.query.loyaltyTransactions.findFirst({
      with: { reward: { columns: { id: true, name: true } } },
      where: eq(loyaltyTransactions.id, tx.id),
    });

    return c.json(full!, 201);
  },
);

// ─── POST /:customerId/adjust ─────────────────────────────────────────────────

loyaltyRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/{customerId}/adjust',
    tags: ['Loyalty'],
    summary: 'Admin adjustment to a customer\'s points balance',
    request: {
      params: z.object({ customerId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: AdjustPointsSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: LoyaltyTransactionWithDetailsSchema } },
        description: 'Adjustment applied',
      },
      404: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Customer not found',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { customerId } = c.req.valid('param');
    const { points, description } = c.req.valid('json');

    const customer = await db.query.customers.findFirst({ where: eq(customers.id, customerId) });
    if (!customer) return c.json({ error: 'Customer not found' }, 404);

    const [tx] = await db
      .insert(loyaltyTransactions)
      .values({ customerId, type: 'adjustment', points, description })
      .returning();

    const full = await db.query.loyaltyTransactions.findFirst({
      with: { reward: { columns: { id: true, name: true } } },
      where: eq(loyaltyTransactions.id, tx.id),
    });

    return c.json(full!, 201);
  },
);
