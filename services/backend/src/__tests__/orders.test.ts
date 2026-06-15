import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeEnv(db: object) {
  return { DATABASE_URL: 'mock' } as never;
}

// Mock createDb so tests don't need a real DB
vi.mock('../db', () => ({
  createDb: vi.fn(() => ({
    query: {
      menuItems: {
        findMany: vi.fn(async () => [
          { id: 'item-1', name: 'Bruschetta', priceCents: 1100, isAvailable: true },
          { id: 'item-2', name: 'Salmon', priceCents: 2800, isAvailable: true },
        ]),
      },
      orders: {
        findFirst: vi.fn(async () => ({
          id: 'order-1',
          status: 'pending',
          customerId: null,
          totalCents: 3900,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        findMany: vi.fn(async () => []),
      },
      customers: { findFirst: vi.fn(async () => null) },
      settings: { findFirst: vi.fn(async () => null) },
    },
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(async () => [{ count: 0 }]) })) })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 'new-order', status: 'pending', totalCents: 3900, customerId: null, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]) })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(async () => []) })) })),
    })),
  })),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

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
      body: JSON.stringify({ items: [{ menuItemId: 'item-1', quantity: 0 }] }),
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /orders/:id/status — state machine', () => {
  it('rejects invalid transition pending → completed', async () => {
    // The mock returns status: 'pending', we try to jump to 'completed'
    const res = await app.request('/orders/order-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Cannot transition');
  });

  it('rejects invalid transition pending → preparing', async () => {
    const res = await app.request('/orders/order-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'preparing' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid status value', async () => {
    const res = await app.request('/orders/order-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'shipped' }),
    });
    expect(res.status).toBe(400);
  });
});

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
