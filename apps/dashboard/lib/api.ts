/**
 * Typed API functions using the shared customFetch from @ody/api-client.
 * These are hand-written to unblock development before running gen:contract.
 * After `pnpm gen:contract`, Orval generates equivalent (and more complete)
 * hooks in packages/api-client/src/generated/ — update imports there.
 */
import { customFetch } from '@ody/api-client';

const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787') as string;
const url = (path: string) => `${base}${path}`;

// ─── Types (mirror backend validators) ───────────────────────────────────────

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  prepTimeMinutes: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MenuItemWithCategory = MenuItem & { category: MenuCategory };

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerWithStats = Customer & {
  orderCount: number;
  totalSpentCents: number;
  lastOrderAt: string | null;
};

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  createdAt: string;
  menuItem: Pick<MenuItem, 'id' | 'name' | 'priceCents' | 'imageUrl'>;
};

export type Order = {
  id: string;
  customerId: string | null;
  status: OrderStatus;
  totalCents: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderWithDetails = Order & {
  customer: Customer | null;
  items: OrderItem[];
};

export type Settings = {
  id: string;
  restaurantName: string;
  restaurantPhone: string | null;
  restaurantAddress: string | null;
  prepTimeMinutes: number;
  autoAcceptOrders: boolean;
  isOpen: boolean;
  openingHours: Record<string, { open: string; close: string; isClosed: boolean }> | null;
  loyaltyPointsPerDollar: number;
  loyaltyEnabled: boolean;
  updatedAt: string;
};

export type RewardType = 'discount_percent' | 'discount_fixed' | 'free_item';

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  rewardType: RewardType;
  discountValue: number | null;
  menuItemId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  menuItem?: { id: string; name: string } | null;
};

export type LoyaltyTxType = 'earn' | 'redeem' | 'adjustment' | 'expire';

export type LoyaltyTransaction = {
  id: string;
  customerId: string;
  orderId: string | null;
  rewardId: string | null;
  type: LoyaltyTxType;
  points: number;
  description: string;
  createdAt: string;
  reward?: { id: string; name: string } | null;
};

export type LoyaltyBalance = {
  customerId: string;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: LoyaltyTransaction[];
};

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type Reservation = {
  id: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  partySize: number;
  reservationDate: string;
  status: ReservationStatus;
  tableNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
};

export type HomeStats = {
  totalOrdersToday: number;
  revenueToday: number;
  pendingOrders: number;
  totalOrdersAllTime: number;
  revenueAllTime: number;
  reservationsToday: number;
  upcomingReservations: Reservation[];
  popularItems: { menuItemId: string; name: string; orderCount: number; revenueCents: number }[];
  recentOrders: OrderWithDetails[];
  ordersByStatus: Record<string, number>;
};

// ─── Menu Categories ──────────────────────────────────────────────────────────

export const api = {
  menuCategories: {
    list: () => customFetch<MenuCategory[]>(url('/menu-categories')),
    get: (id: string) => customFetch<MenuCategory>(url(`/menu-categories/${id}`)),
    create: (body: { name: string; description?: string; sortOrder?: number }) =>
      customFetch<MenuCategory>(url('/menu-categories'), { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; description: string; sortOrder: number; isActive: boolean }>) =>
      customFetch<MenuCategory>(url(`/menu-categories/${id}`), { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      customFetch<{ success: boolean }>(url(`/menu-categories/${id}`), { method: 'DELETE' }),
  },

  menuItems: {
    list: (params?: { categoryId?: string; available?: 'true' | 'false' }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return customFetch<MenuItemWithCategory[]>(url(`/menu-items${qs ? `?${qs}` : ''}`));
    },
    get: (id: string) => customFetch<MenuItemWithCategory>(url(`/menu-items/${id}`)),
    create: (body: { categoryId: string; name: string; description?: string; priceCents: number; isAvailable?: boolean; prepTimeMinutes?: number }) =>
      customFetch<MenuItem>(url('/menu-items'), { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; description: string; priceCents: number; isAvailable: boolean; categoryId: string; prepTimeMinutes: number }>) =>
      customFetch<MenuItem>(url(`/menu-items/${id}`), { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      customFetch<{ success: boolean }>(url(`/menu-items/${id}`), { method: 'DELETE' }),
  },

  orders: {
    list: (params?: { status?: OrderStatus; customerId?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return customFetch<{ data: OrderWithDetails[]; total: number }>(url(`/orders${qs ? `?${qs}` : ''}`));
    },
    get: (id: string) => customFetch<OrderWithDetails>(url(`/orders/${id}`)),
    create: (body: { customerId?: string | null; items: { menuItemId: string; quantity: number }[]; notes?: string }) =>
      customFetch<OrderWithDetails>(url('/orders'), { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id: string, status: OrderStatus) =>
      customFetch<OrderWithDetails>(url(`/orders/${id}/status`), { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  customers: {
    list: (params?: { limit?: number; offset?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return customFetch<{ data: CustomerWithStats[]; total: number }>(url(`/customers${qs ? `?${qs}` : ''}`));
    },
    get: (id: string) =>
      customFetch<CustomerWithStats & { recentOrders: OrderWithDetails[] }>(url(`/customers/${id}`)),
    create: (body: { name: string; email?: string; phone?: string; notes?: string }) =>
      customFetch<Customer>(url('/customers'), { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; email: string; phone: string; notes: string }>) =>
      customFetch<Customer>(url(`/customers/${id}`), { method: 'PUT', body: JSON.stringify(body) }),
  },

  settings: {
    get: () => customFetch<Settings>(url('/settings')),
    update: (body: Partial<Settings>) =>
      customFetch<Settings>(url('/settings'), { method: 'PUT', body: JSON.stringify(body) }),
  },

  home: {
    stats: () => customFetch<HomeStats>(url('/home/stats')),
  },

  rewards: {
    list: (params?: { active?: boolean }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return customFetch<Reward[]>(url(`/rewards${qs ? `?${qs}` : ''}`));
    },
    get: (id: string) => customFetch<Reward>(url(`/rewards/${id}`)),
    create: (body: { name: string; description?: string; pointsCost: number; rewardType: RewardType; discountValue?: number; menuItemId?: string }) =>
      customFetch<Reward>(url('/rewards'), { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; description: string; pointsCost: number; discountValue: number; isActive: boolean }>) =>
      customFetch<Reward>(url(`/rewards/${id}`), { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      customFetch<{ success: boolean }>(url(`/rewards/${id}`), { method: 'DELETE' }),
  },

  loyalty: {
    get: (customerId: string) => customFetch<LoyaltyBalance>(url(`/loyalty/${customerId}`)),
    earn: (customerId: string, body: { points: number; description: string; orderId?: string }) =>
      customFetch<LoyaltyTransaction>(url(`/loyalty/${customerId}/earn`), { method: 'POST', body: JSON.stringify(body) }),
    redeem: (customerId: string, rewardId: string) =>
      customFetch<LoyaltyTransaction>(url(`/loyalty/${customerId}/redeem`), { method: 'POST', body: JSON.stringify({ rewardId }) }),
    adjust: (customerId: string, body: { points: number; description: string }) =>
      customFetch<LoyaltyTransaction>(url(`/loyalty/${customerId}/adjust`), { method: 'POST', body: JSON.stringify(body) }),
  },

  reservations: {
    list: (params?: { status?: string; date?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return customFetch<{ data: Reservation[]; total: number }>(url(`/reservations${qs ? `?${qs}` : ''}`));
    },
    get: (id: string) => customFetch<Reservation>(url(`/reservations/${id}`)),
    create: (body: {
      customerName: string;
      customerPhone?: string;
      partySize: number;
      reservationDate: string;
      tableNumber?: string;
      notes?: string;
      customerId?: string;
    }) => customFetch<Reservation>(url('/reservations'), { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ customerName: string; customerPhone: string; partySize: number; reservationDate: string; tableNumber: string; notes: string }>) =>
      customFetch<Reservation>(url(`/reservations/${id}`), { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (id: string, status: string) =>
      customFetch<Reservation>(url(`/reservations/${id}/status`), { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) =>
      customFetch<{ success: boolean }>(url(`/reservations/${id}`), { method: 'DELETE' }),
  },
};
