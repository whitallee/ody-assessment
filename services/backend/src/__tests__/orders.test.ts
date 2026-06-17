import { describe, it, expect, vi } from 'vitest';
import app from '../index';

const ORDER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ITEM_ID_1 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const ITEM_ID_2 = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

// Mock createDb so tests never need a real DB connection
vi.mock('../db', () => ({
  createDb: vi.fn(() => ({
    query: {
      menuItems: {
        findMany: vi.fn(async () => [
          { id: ITEM_ID_1, name: 'Bruschetta', priceCents: 1100, isAvailable: true },
          { id: ITEM_ID_2, name: 'Salmon', priceCents: 2800, isAvailable: true },
        ]),
      },
      orders: {
        findFirst: vi.fn(async () => ({
          id: ORDER_ID,
          status: 'pending',
          customerId: null,
          totalCents: 3900,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customer: null,
          items: [],
        })),
        findMany: vi.fn(async () => []),
      },
      customers: { findFirst: vi.fn(async () => null) },
      settings: { findFirst: vi.fn(async () => ({ loyaltyEnabled: false, loyaltyPointsPerDollar: 10 })) },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => [{ count: 0 }]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => [{
          id: ORDER_ID,
          status: 'pending',
          totalCents: 3900,
          customerId: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    })),
  })),
}));

// ─── POST /orders ─────────────────────────────────────────────────────────────

describe('POST /orders', () => {
  it('rejects an empty items array', async () => {
    const res = await app.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects when items field is missing', async () => {
    const res = await app.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'no items' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects items with quantity 0', async () => {
    const res = await app.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ menuItemId: ITEM_ID_1, quantity: 0 }] }),
    });
    expect(res.status).toBe(400);
  });
});

// ─── PATCH /orders/:id/status ─────────────────────────────────────────────────

describe('PATCH /orders/:id/status — state machine', () => {
  it('rejects invalid transition pending → completed', async () => {
    const res = await app.request(`/orders/${ORDER_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Cannot transition');
  });

  it('rejects invalid transition pending → preparing', async () => {
    const res = await app.request(`/orders/${ORDER_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'preparing' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Cannot transition');
  });

  it('rejects an invalid status value', async () => {
    const res = await app.request(`/orders/${ORDER_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'shipped' }),
    });
    expect(res.status).toBe(400);
  });

  it('accepts valid transition pending → accepted', async () => {
    const res = await app.request(`/orders/${ORDER_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    // Mock update.set.where.returning returns [] so handler will 404, but the
    // state machine check itself must pass (no 400 from transition guard)
    expect(res.status).not.toBe(400);
  });
});

// ─── Utility routes ───────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});

describe('GET /openapi.json', () => {
  it('returns a valid OpenAPI 3.1 document', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);
    const doc = await res.json() as { openapi: string; info: { title: string } };
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.title).toBeTruthy();
  });
});
