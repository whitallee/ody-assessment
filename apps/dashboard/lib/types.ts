export type {
  GetMenuCategories200Item as MenuCategory,
  GetMenuItems200Item as MenuItem,
  GetOrders200DataItem as OrderWithDetails,
  GetCustomers200DataItem as CustomerWithStats,
  GetCustomersId200 as CustomerDetail,
  GetHomeStats200 as HomeStats,
  GetReservations200DataItem as Reservation,
  GetRewards200Item as Reward,
  GetLoyaltyCustomerId200 as LoyaltyBalance,
  GetLoyaltyCustomerId200TransactionsItem as LoyaltyTransaction,
} from '@ody/api-client';

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

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type RewardType = 'discount_percent' | 'discount_fixed' | 'free_item';
export type LoyaltyTxType = 'earn' | 'redeem' | 'adjustment' | 'expire';
