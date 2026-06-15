import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import type { Env } from '../index';
import { reservations } from '../db/schema';
import { RESERVATION_TRANSITIONS } from '../db/schema';
import {
  ReservationWithCustomerSchema,
  CreateReservationSchema,
  UpdateReservationSchema,
  UpdateReservationStatusSchema,
} from '../db/validators';

export const reservationsRoutes = new OpenAPIHono<Env>();

// ─── GET / ────────────────────────────────────────────────────────────────────

reservationsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Reservations'],
    summary: 'List reservations with optional filters',
    request: {
      query: z.object({
        status: z
          .enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
          .optional(),
        date: z.string().date().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional().default(50),
        offset: z.coerce.number().int().min(0).optional().default(0),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(ReservationWithCustomerSchema),
              total: z.number().int(),
            }),
          },
        },
        description: 'Paginated list of reservations',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const { status, date, limit, offset } = c.req.valid('query');

    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;
    if (date) {
      dateStart = new Date(`${date}T00:00:00Z`);
      dateEnd = new Date(`${date}T23:59:59Z`);
    }

    const where = and(
      status ? eq(reservations.status, status) : undefined,
      dateStart ? gte(reservations.reservationDate, dateStart) : undefined,
      dateEnd ? lte(reservations.reservationDate, dateEnd) : undefined,
    );

    const [rows, [{ count }]] = await Promise.all([
      db.query.reservations.findMany({
        with: { customer: true },
        where,
        orderBy: [desc(reservations.reservationDate)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(reservations).where(where),
    ]);

    return c.json({ data: rows, total: count }, 200);
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

reservationsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Reservations'],
    summary: 'Get a single reservation',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: ReservationWithCustomerSchema } },
        description: 'Reservation with customer',
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
    const row = await db.query.reservations.findFirst({
      with: { customer: true },
      where: eq(reservations.id, id),
    });
    if (!row) return c.json({ error: 'Reservation not found' }, 404);
    return c.json(row, 200);
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

reservationsRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Reservations'],
    summary: 'Create a new reservation',
    request: {
      body: {
        content: { 'application/json': { schema: CreateReservationSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: ReservationWithCustomerSchema } },
        description: 'Created reservation',
      },
    },
  }),
  async (c) => {
    const db = c.get('db');
    const body = c.req.valid('json');

    const [row] = await db
      .insert(reservations)
      .values({
        ...body,
        reservationDate: new Date(body.reservationDate),
      })
      .returning();

    const full = await db.query.reservations.findFirst({
      with: { customer: true },
      where: eq(reservations.id, row.id),
    });

    return c.json(full!, 201);
  },
);

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

reservationsRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Reservations'],
    summary: 'Update reservation details',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateReservationSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: ReservationWithCustomerSchema } },
        description: 'Updated reservation',
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

    const existing = await db.query.reservations.findFirst({ where: eq(reservations.id, id) });
    if (!existing) return c.json({ error: 'Reservation not found' }, 404);

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.reservationDate) {
      updateData.reservationDate = new Date(body.reservationDate);
    }

    await db.update(reservations).set(updateData).where(eq(reservations.id, id));

    const full = await db.query.reservations.findFirst({
      with: { customer: true },
      where: eq(reservations.id, id),
    });

    return c.json(full!, 200);
  },
);

// ─── PATCH /:id/status ────────────────────────────────────────────────────────

reservationsRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/status',
    tags: ['Reservations'],
    summary: 'Advance reservation status through valid transitions',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: UpdateReservationStatusSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: ReservationWithCustomerSchema } },
        description: 'Updated reservation',
      },
      400: {
        content: { 'application/json': { schema: z.object({ error: z.string() }) } },
        description: 'Invalid status transition',
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
    const { status: newStatus } = c.req.valid('json');

    const existing = await db.query.reservations.findFirst({ where: eq(reservations.id, id) });
    if (!existing) return c.json({ error: 'Reservation not found' }, 404);

    const allowed = RESERVATION_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      return c.json(
        {
          error: `Cannot transition from '${existing.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
        },
        400,
      );
    }

    await db
      .update(reservations)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(reservations.id, id));

    const full = await db.query.reservations.findFirst({
      with: { customer: true },
      where: eq(reservations.id, id),
    });

    return c.json(full!, 200);
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

reservationsRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Reservations'],
    summary: 'Delete a reservation',
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
    const existing = await db.query.reservations.findFirst({ where: eq(reservations.id, id) });
    if (!existing) return c.json({ error: 'Reservation not found' }, 404);
    await db.delete(reservations).where(eq(reservations.id, id));
    return c.json({ success: true }, 200);
  },
);
