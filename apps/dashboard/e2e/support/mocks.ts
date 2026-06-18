import type { Page } from '@playwright/test';

const API_BASE = 'http://localhost:8787';

export const mockData = {
  homeStats: {
    totalOrdersToday: 12,
    pendingOrders: 3,
    revenueToday: 45000,
    revenueAllTime: 1234567,
    totalOrdersAllTime: 450,
    reservationsToday: 5,
    customersTotal: 120,
    upcomingReservations: [
      {
        id: 'res-1',
        guestName: 'David Lee',
        partySize: 4,
        date: '2024-06-18',
        time: '19:00',
        status: 'confirmed',
      },
    ],
    recentOrders: [
      {
        id: 'order-1',
        status: 'pending',
        totalCents: 2500,
        createdAt: new Date().toISOString(),
        customer: { name: 'Alice Johnson' },
        items: [{ quantity: 1, menuItem: { name: 'Classic Burger' } }],
      },
      {
        id: 'order-2',
        status: 'preparing',
        totalCents: 1800,
        createdAt: new Date().toISOString(),
        customer: { name: 'Bob Smith' },
        items: [{ quantity: 2, menuItem: { name: 'Caesar Salad' } }],
      },
    ],
  },

  orders: {
    data: [
      {
        id: 'order-1',
        status: 'pending',
        totalCents: 2500,
        createdAt: new Date().toISOString(),
        customer: { id: 'cust-1', name: 'Alice Johnson' },
        items: [
          { id: 'oi-1', quantity: 1, unitPriceCents: 2500, menuItem: { id: 'item-1', name: 'Classic Burger' } },
        ],
      },
      {
        id: 'order-2',
        status: 'preparing',
        totalCents: 1800,
        createdAt: new Date().toISOString(),
        customer: { id: 'cust-2', name: 'Bob Smith' },
        items: [
          { id: 'oi-2', quantity: 2, unitPriceCents: 900, menuItem: { id: 'item-2', name: 'Caesar Salad' } },
        ],
      },
      {
        id: 'order-3',
        status: 'completed',
        totalCents: 3200,
        createdAt: new Date().toISOString(),
        customer: { id: 'cust-3', name: 'Charlie Brown' },
        items: [
          { id: 'oi-3', quantity: 1, unitPriceCents: 3200, menuItem: { id: 'item-3', name: 'Ribeye Steak' } },
        ],
      },
    ],
    total: 3,
  },

  customers: {
    data: [
      {
        id: 'cust-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: null,
        orderCount: 5,
        totalSpentCents: 12500,
        lastOrderAt: new Date().toISOString(),
      },
      {
        id: 'cust-2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: null,
        orderCount: 2,
        totalSpentCents: 5000,
        lastOrderAt: null,
      },
      {
        id: 'cust-3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        phone: null,
        orderCount: 8,
        totalSpentCents: 22000,
        lastOrderAt: new Date().toISOString(),
      },
    ],
    total: 3,
  },

  menuCategories: [
    { id: 'cat-1', name: 'Burgers', sortOrder: 1 },
    { id: 'cat-2', name: 'Salads', sortOrder: 2 },
  ],

  menuItems: [
    {
      id: 'item-1',
      name: 'Classic Burger',
      description: 'A classic beef burger with lettuce and tomato',
      priceCents: 1200,
      categoryId: 'cat-1',
      available: true,
      sortOrder: 1,
      category: { id: 'cat-1', name: 'Burgers', sortOrder: 1 },
    },
    {
      id: 'item-2',
      name: 'Caesar Salad',
      description: 'Fresh romaine with house caesar dressing',
      priceCents: 900,
      categoryId: 'cat-2',
      available: true,
      sortOrder: 1,
      category: { id: 'cat-2', name: 'Salads', sortOrder: 2 },
    },
  ],

  reservations: {
    data: [
      {
        id: 'res-1',
        guestName: 'David Lee',
        guestPhone: null,
        partySize: 4,
        date: '2024-06-18',
        time: '19:00',
        tableId: null,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      },
    ],
    total: 1,
  },

  rewards: [],
};

export async function setupApiMocks(page: Page): Promise<void> {
  // Catch-all first (lowest priority — LIFO means this is matched last)
  await page.route(`${API_BASE}/**`, (route) => route.fulfill({ json: {} }));

  // Specific routes registered after (higher priority, matched first)
  await page.route(`${API_BASE}/home/stats`, (route) =>
    route.fulfill({ json: mockData.homeStats }),
  );

  await page.route(`${API_BASE}/orders**`, (route) => {
    // PATCH .../status returns a single updated order
    if (route.request().method() === 'PATCH') {
      const url = route.request().url();
      const id = url.split('/orders/')[1]?.split('/')[0] ?? 'order-1';
      const updated = mockData.orders.data.find((o) => o.id === id) ?? mockData.orders.data[0];
      route.fulfill({ json: { ...updated, status: 'accepted' } });
    } else {
      route.fulfill({ json: mockData.orders });
    }
  });

  await page.route(`${API_BASE}/customers**`, (route) =>
    route.fulfill({ json: mockData.customers }),
  );

  await page.route(`${API_BASE}/menu-categories**`, (route) =>
    route.fulfill({ json: mockData.menuCategories }),
  );

  await page.route(`${API_BASE}/menu-items**`, (route) =>
    route.fulfill({ json: mockData.menuItems }),
  );

  await page.route(`${API_BASE}/reservations**`, (route) =>
    route.fulfill({ json: mockData.reservations }),
  );

  await page.route(`${API_BASE}/rewards**`, (route) =>
    route.fulfill({ json: mockData.rewards }),
  );

  await page.route(`${API_BASE}/loyalty**`, (route) =>
    route.fulfill({ json: { pointsBalance: 0, totalEarned: 0, totalRedeemed: 0, transactions: [] } }),
  );

  await page.route(`${API_BASE}/tables**`, (route) =>
    route.fulfill({ json: [] }),
  );
}
