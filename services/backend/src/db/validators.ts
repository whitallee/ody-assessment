import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  menuCategories,
  menuItems,
  customers,
  orders,
  orderItems,
  settings,
  reservations,
  orderStatusEnum,
  reservationStatusEnum,
} from './schema';

// ─── Menu Categories ──────────────────────────────────────────────────────────

export const MenuCategorySchema = createSelectSchema(menuCategories);

export const CreateMenuCategorySchema = createInsertSchema(menuCategories, {
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const UpdateMenuCategorySchema = CreateMenuCategorySchema.partial();

export type MenuCategory = z.infer<typeof MenuCategorySchema>;
export type CreateMenuCategory = z.infer<typeof CreateMenuCategorySchema>;
export type UpdateMenuCategory = z.infer<typeof UpdateMenuCategorySchema>;

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const MenuItemSchema = createSelectSchema(menuItems);

export const MenuItemWithCategorySchema = MenuItemSchema.extend({
  category: MenuCategorySchema,
});

export const CreateMenuItemSchema = createInsertSchema(menuItems, {
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(1),
  prepTimeMinutes: z.number().int().min(1).max(240).optional(),
  sortOrder: z.number().int().min(0).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuItemWithCategory = z.infer<typeof MenuItemWithCategorySchema>;
export type CreateMenuItem = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItem = z.infer<typeof UpdateMenuItemSchema>;

// ─── Customers ────────────────────────────────────────────────────────────────

export const CustomerSchema = createSelectSchema(customers);

export const CustomerWithStatsSchema = CustomerSchema.extend({
  orderCount: z.number().int(),
  totalSpentCents: z.number().int(),
  lastOrderAt: z.string().nullable(),
});

export const CreateCustomerSchema = createInsertSchema(customers, {
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerWithStats = z.infer<typeof CustomerWithStatsSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const OrderStatusSchema = z.enum(orderStatusEnum.enumValues);

export const OrderItemSchema = createSelectSchema(orderItems).extend({
  menuItem: MenuItemSchema.pick({
    id: true,
    name: true,
    priceCents: true,
    imageUrl: true,
  }),
});

export const OrderSchema = createSelectSchema(orders);

export const OrderWithDetailsSchema = OrderSchema.extend({
  customer: CustomerSchema.nullable(),
  items: z.array(OrderItemSchema),
});

export const CreateOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  items: z.array(CreateOrderItemSchema).min(1),
  notes: z.string().max(1000).optional().nullable(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderWithDetails = z.infer<typeof OrderWithDetailsSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;

// ─── Settings ────────────────────────────────────────────────────────────────

export const OpeningHoursSchema = z.record(
  z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
    isClosed: z.boolean(),
  }),
);

export const SettingsSchema = createSelectSchema(settings).extend({
  openingHours: OpeningHoursSchema.nullable(),
});

export const UpdateSettingsSchema = createInsertSchema(settings, {
  restaurantName: z.string().min(1).max(200),
  restaurantPhone: z.string().max(20).optional().nullable(),
  restaurantAddress: z.string().max(500).optional().nullable(),
  prepTimeMinutes: z.number().int().min(1).max(120).optional(),
  openingHours: OpeningHoursSchema.optional().nullable(),
}).omit({ id: true, updatedAt: true }).partial();

export type Settings = z.infer<typeof SettingsSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;

// ─── Reservations ─────────────────────────────────────────────────────────────

export const ReservationStatusSchema = z.enum(reservationStatusEnum.enumValues);

export const ReservationSchema = createSelectSchema(reservations);

export const ReservationWithCustomerSchema = ReservationSchema.extend({
  customer: CustomerSchema.nullable(),
});

export const CreateReservationSchema = createInsertSchema(reservations, {
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(20).optional().nullable(),
  partySize: z.number().int().min(1).max(50),
  reservationDate: z.string().datetime(),
  tableNumber: z.string().max(20).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const UpdateReservationSchema = CreateReservationSchema.partial();

export const UpdateReservationStatusSchema = z.object({
  status: ReservationStatusSchema,
});

export type Reservation = z.infer<typeof ReservationSchema>;
export type ReservationWithCustomer = z.infer<typeof ReservationWithCustomerSchema>;
export type CreateReservation = z.infer<typeof CreateReservationSchema>;
export type UpdateReservation = z.infer<typeof UpdateReservationSchema>;
export type UpdateReservationStatus = z.infer<typeof UpdateReservationStatusSchema>;

// ─── Home / KPIs ─────────────────────────────────────────────────────────────

export const HomeStatsSchema = z.object({
  totalOrdersToday: z.number().int(),
  revenueToday: z.number().int(),
  pendingOrders: z.number().int(),
  totalOrdersAllTime: z.number().int(),
  revenueAllTime: z.number().int(),
  reservationsToday: z.number().int(),
  upcomingReservations: z.array(ReservationWithCustomerSchema),
  popularItems: z.array(
    z.object({
      menuItemId: z.string().uuid(),
      name: z.string(),
      orderCount: z.number().int(),
      revenueCents: z.number().int(),
    }),
  ),
  recentOrders: z.array(OrderWithDetailsSchema),
  ordersByStatus: z.record(z.string(), z.number()),
});

export type HomeStats = z.infer<typeof HomeStatsSchema>;
