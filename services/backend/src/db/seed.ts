/**
 * Seeds the database with sample restaurant data.
 * Run via: pnpm db:seed
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../../.env') });
import { createDb } from './index';
import {
  menuCategories,
  menuItems,
  customers,
  orders,
  orderItems,
  settings,
  reservations,
  rewards,
  loyaltyTransactions,
} from './schema';

const db = createDb(process.env.DATABASE_URL!);

async function seed() {
  console.log('🌱 Seeding database...');

  // Settings
  await db.delete(settings);
  await db.insert(settings).values({
    restaurantName: 'The Golden Fork',
    restaurantPhone: '+1 (555) 234-5678',
    restaurantAddress: '123 Main Street, San Francisco, CA 94105',
    prepTimeMinutes: 20,
    autoAcceptOrders: false,
    isOpen: true,
    loyaltyPointsPerDollar: 10,
    loyaltyEnabled: true,
    openingHours: {
      monday: { open: '11:00', close: '22:00', isClosed: false },
      tuesday: { open: '11:00', close: '22:00', isClosed: false },
      wednesday: { open: '11:00', close: '22:00', isClosed: false },
      thursday: { open: '11:00', close: '22:00', isClosed: false },
      friday: { open: '11:00', close: '23:00', isClosed: false },
      saturday: { open: '10:00', close: '23:00', isClosed: false },
      sunday: { open: '10:00', close: '21:00', isClosed: false },
    },
  });
  console.log('  ✓ Settings');

  // Categories
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(menuItems);
  await db.delete(menuCategories);

  const [starters, mains, pasta, desserts, drinks] = await db
    .insert(menuCategories)
    .values([
      { name: 'Starters', description: 'Light bites to begin your meal', sortOrder: 0 },
      { name: 'Mains', description: 'Hearty entrees', sortOrder: 1 },
      { name: 'Pasta & Risotto', description: 'House-made pastas and risottos', sortOrder: 2 },
      { name: 'Desserts', description: 'Sweet endings', sortOrder: 3 },
      { name: 'Drinks', description: 'Beverages and cocktails', sortOrder: 4 },
    ])
    .returning();
  console.log('  ✓ Menu categories');

  // Menu Items
  const [
    bruschetta,
    calamari,
    soup,
    salmon,
    chicken,
    steak,
    tagliatelle,
    risotto,
    pumpkinRavioli,
    tiramisu,
    pannaCotta,
    water,
    wine,
    juice,
  ] = await db
    .insert(menuItems)
    .values([
      // Starters
      { categoryId: starters.id, name: 'Bruschetta al Pomodoro', description: 'Toasted bread with fresh tomatoes, garlic, and basil', priceCents: 1100, prepTimeMinutes: 8, sortOrder: 0 },
      { categoryId: starters.id, name: 'Crispy Calamari', description: 'Lightly fried squid with marinara and lemon aioli', priceCents: 1400, prepTimeMinutes: 10, sortOrder: 1 },
      { categoryId: starters.id, name: 'Roasted Tomato Soup', description: 'Slow-roasted tomatoes with cream and fresh basil', priceCents: 950, prepTimeMinutes: 5, sortOrder: 2 },
      // Mains
      { categoryId: mains.id, name: 'Pan-Seared Salmon', description: 'Atlantic salmon with capers, lemon butter, and seasonal greens', priceCents: 2800, prepTimeMinutes: 18, sortOrder: 0 },
      { categoryId: mains.id, name: 'Rosemary Roasted Chicken', description: 'Half chicken with herb jus, roasted potatoes, and vegetables', priceCents: 2400, prepTimeMinutes: 25, sortOrder: 1 },
      { categoryId: mains.id, name: 'Grilled Ribeye Steak', description: '12oz dry-aged ribeye with truffle butter and house fries', priceCents: 4500, prepTimeMinutes: 22, sortOrder: 2 },
      // Pasta & Risotto
      { categoryId: pasta.id, name: 'Tagliatelle Bolognese', description: 'House-made tagliatelle with slow-cooked beef ragù', priceCents: 1900, prepTimeMinutes: 15, sortOrder: 0 },
      { categoryId: pasta.id, name: 'Mushroom Risotto', description: 'Arborio rice with wild mushrooms, parmesan, and truffle oil', priceCents: 1750, prepTimeMinutes: 20, sortOrder: 1 },
      { categoryId: pasta.id, name: 'Pumpkin Ravioli', description: 'Fresh pasta filled with roasted pumpkin and ricotta in brown butter', priceCents: 1850, prepTimeMinutes: 15, sortOrder: 2 },
      // Desserts
      { categoryId: desserts.id, name: 'Tiramisù', description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone', priceCents: 1100, prepTimeMinutes: 5, sortOrder: 0 },
      { categoryId: desserts.id, name: 'Panna Cotta', description: 'Vanilla cream with seasonal berry coulis', priceCents: 950, prepTimeMinutes: 5, sortOrder: 1 },
      // Drinks
      { categoryId: drinks.id, name: 'Still Water (500ml)', description: 'Filtered still water', priceCents: 350, prepTimeMinutes: 1, sortOrder: 0 },
      { categoryId: drinks.id, name: 'House Red Wine (Glass)', description: 'Italian Montepulciano d\'Abruzzo', priceCents: 1200, prepTimeMinutes: 2, sortOrder: 1 },
      { categoryId: drinks.id, name: 'Fresh-Pressed Orange Juice', description: 'Freshly squeezed seasonal oranges', priceCents: 600, prepTimeMinutes: 3, sortOrder: 2 },
    ])
    .returning();
  console.log('  ✓ Menu items');

  // Customers
  await db.delete(reservations);
  await db.delete(customers);
  const [alice, bob, carol, david, emma] = await db
    .insert(customers)
    .values([
      { name: 'Alice Rossi', email: 'alice.rossi@email.com', phone: '+1 (555) 111-2222' },
      { name: 'Bob Tanaka', email: 'bob.tanaka@email.com', phone: '+1 (555) 333-4444' },
      { name: 'Carol Müller', email: 'carol.muller@email.com', phone: '+1 (555) 555-6666' },
      { name: 'David Chen', email: 'david.chen@email.com', phone: '+1 (555) 777-8888' },
      { name: 'Emma Patel', email: 'emma.patel@email.com', phone: '+1 (555) 999-0000' },
    ])
    .returning();
  console.log('  ✓ Customers');

  // Orders (various statuses + dates to populate KPIs)
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

  const [order1] = await db.insert(orders).values({ customerId: alice.id, status: 'completed', totalCents: bruschetta.priceCents + salmon.priceCents + wine.priceCents, createdAt: hoursAgo(2) }).returning();
  const [order2] = await db.insert(orders).values({ customerId: bob.id, status: 'preparing', totalCents: calamari.priceCents + steak.priceCents + wine.priceCents * 2, createdAt: hoursAgo(1) }).returning();
  const [order3] = await db.insert(orders).values({ customerId: carol.id, status: 'pending', totalCents: tagliatelle.priceCents + tiramisu.priceCents + water.priceCents, notes: 'Please no onions', createdAt: hoursAgo(0.25) }).returning();
  const [order4] = await db.insert(orders).values({ customerId: david.id, status: 'accepted', totalCents: risotto.priceCents + chicken.priceCents + juice.priceCents, createdAt: hoursAgo(0.5) }).returning();
  const [order5] = await db.insert(orders).values({ customerId: emma.id, status: 'ready', totalCents: pumpkinRavioli.priceCents + pannaCotta.priceCents + wine.priceCents, createdAt: hoursAgo(0.75) }).returning();
  // Historical orders for stats
  const [order6] = await db.insert(orders).values({ customerId: alice.id, status: 'completed', totalCents: steak.priceCents + wine.priceCents * 2, createdAt: new Date(now.getTime() - 2 * 86_400_000) }).returning();
  const [order7] = await db.insert(orders).values({ customerId: bob.id, status: 'completed', totalCents: salmon.priceCents + risotto.priceCents + water.priceCents, createdAt: new Date(now.getTime() - 3 * 86_400_000) }).returning();
  const [order8] = await db.insert(orders).values({ customerId: carol.id, status: 'cancelled', totalCents: chicken.priceCents, createdAt: new Date(now.getTime() - 1 * 86_400_000) }).returning();
  console.log('  ✓ Orders');

  // Order Items
  await db.insert(orderItems).values([
    { orderId: order1.id, menuItemId: bruschetta.id, quantity: 1, unitPriceCents: bruschetta.priceCents, subtotalCents: bruschetta.priceCents },
    { orderId: order1.id, menuItemId: salmon.id, quantity: 1, unitPriceCents: salmon.priceCents, subtotalCents: salmon.priceCents },
    { orderId: order1.id, menuItemId: wine.id, quantity: 1, unitPriceCents: wine.priceCents, subtotalCents: wine.priceCents },

    { orderId: order2.id, menuItemId: calamari.id, quantity: 1, unitPriceCents: calamari.priceCents, subtotalCents: calamari.priceCents },
    { orderId: order2.id, menuItemId: steak.id, quantity: 1, unitPriceCents: steak.priceCents, subtotalCents: steak.priceCents },
    { orderId: order2.id, menuItemId: wine.id, quantity: 2, unitPriceCents: wine.priceCents, subtotalCents: wine.priceCents * 2 },

    { orderId: order3.id, menuItemId: tagliatelle.id, quantity: 1, unitPriceCents: tagliatelle.priceCents, subtotalCents: tagliatelle.priceCents },
    { orderId: order3.id, menuItemId: tiramisu.id, quantity: 1, unitPriceCents: tiramisu.priceCents, subtotalCents: tiramisu.priceCents },
    { orderId: order3.id, menuItemId: water.id, quantity: 1, unitPriceCents: water.priceCents, subtotalCents: water.priceCents },

    { orderId: order4.id, menuItemId: risotto.id, quantity: 1, unitPriceCents: risotto.priceCents, subtotalCents: risotto.priceCents },
    { orderId: order4.id, menuItemId: chicken.id, quantity: 1, unitPriceCents: chicken.priceCents, subtotalCents: chicken.priceCents },
    { orderId: order4.id, menuItemId: juice.id, quantity: 1, unitPriceCents: juice.priceCents, subtotalCents: juice.priceCents },

    { orderId: order5.id, menuItemId: pumpkinRavioli.id, quantity: 1, unitPriceCents: pumpkinRavioli.priceCents, subtotalCents: pumpkinRavioli.priceCents },
    { orderId: order5.id, menuItemId: pannaCotta.id, quantity: 1, unitPriceCents: pannaCotta.priceCents, subtotalCents: pannaCotta.priceCents },
    { orderId: order5.id, menuItemId: wine.id, quantity: 1, unitPriceCents: wine.priceCents, subtotalCents: wine.priceCents },

    { orderId: order6.id, menuItemId: steak.id, quantity: 1, unitPriceCents: steak.priceCents, subtotalCents: steak.priceCents },
    { orderId: order6.id, menuItemId: wine.id, quantity: 2, unitPriceCents: wine.priceCents, subtotalCents: wine.priceCents * 2 },

    { orderId: order7.id, menuItemId: salmon.id, quantity: 1, unitPriceCents: salmon.priceCents, subtotalCents: salmon.priceCents },
    { orderId: order7.id, menuItemId: risotto.id, quantity: 1, unitPriceCents: risotto.priceCents, subtotalCents: risotto.priceCents },
    { orderId: order7.id, menuItemId: water.id, quantity: 1, unitPriceCents: water.priceCents, subtotalCents: water.priceCents },

    { orderId: order8.id, menuItemId: chicken.id, quantity: 1, unitPriceCents: chicken.priceCents, subtotalCents: chicken.priceCents },
  ]);
  console.log('  ✓ Order items');

  // Reservations
  await db.delete(reservations);
  const daysFromNow = (d: number, h = 19, m = 0) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  await db.insert(reservations).values([
    { customerName: 'Alice Rossi', customerId: alice.id, customerPhone: '+1 (555) 111-2222', partySize: 2, reservationDate: daysFromNow(0, 19, 0), status: 'confirmed', tableNumber: '4', notes: 'Anniversary dinner' },
    { customerName: 'Bob Tanaka', customerId: bob.id, customerPhone: '+1 (555) 333-4444', partySize: 4, reservationDate: daysFromNow(0, 20, 30), status: 'pending', tableNumber: '7' },
    { customerName: 'Carol Müller', customerId: carol.id, customerPhone: '+1 (555) 555-6666', partySize: 3, reservationDate: daysFromNow(1, 18, 30), status: 'confirmed' },
    { customerName: 'David Chen', customerId: david.id, customerPhone: '+1 (555) 777-8888', partySize: 6, reservationDate: daysFromNow(1, 19, 30), status: 'pending', tableNumber: '12', notes: 'Birthday party, need cake service' },
    { customerName: 'Emma Patel', customerId: emma.id, customerPhone: '+1 (555) 999-0000', partySize: 2, reservationDate: daysFromNow(2, 20, 0), status: 'confirmed', tableNumber: '2' },
    { customerName: 'Marco Russo', customerPhone: '+1 (555) 123-9876', partySize: 5, reservationDate: daysFromNow(3, 19, 0), status: 'pending' },
    { customerName: 'Sophie Laurent', customerPhone: '+33 6 12 34 56 78', partySize: 2, reservationDate: daysFromNow(-1, 20, 0), status: 'completed', tableNumber: '3' },
    { customerName: 'James Park', customerPhone: '+1 (555) 456-7890', partySize: 3, reservationDate: daysFromNow(-1, 19, 0), status: 'no_show' },
    { customerName: 'Lucia Fernandez', customerPhone: '+1 (555) 234-5678', partySize: 4, reservationDate: daysFromNow(-2, 18, 30), status: 'completed', tableNumber: '8', notes: 'Gluten-free options needed' },
  ]);
  console.log('  ✓ Reservations');

  // Rewards
  await db.delete(loyaltyTransactions);
  await db.delete(rewards);

  const [freeDesert, tenOff, fifteenPercent, freeStarter, vipSteak] = await db
    .insert(rewards)
    .values([
      { name: 'Free Dessert', description: 'Any dessert on us', pointsCost: 500, rewardType: 'free_item', menuItemId: tiramisu.id, isActive: true },
      { name: '$10 Off Your Bill', description: '$10 discount on your total', pointsCost: 800, rewardType: 'discount_fixed', discountValue: 1000, isActive: true },
      { name: '15% Off', description: '15% off your entire order', pointsCost: 1200, rewardType: 'discount_percent', discountValue: 15, isActive: true },
      { name: 'Free Starter', description: 'Any starter on the house', pointsCost: 400, rewardType: 'free_item', menuItemId: bruschetta.id, isActive: true },
      { name: 'VIP Ribeye Night', description: 'Free ribeye steak for two loyal visits', pointsCost: 3000, rewardType: 'free_item', menuItemId: steak.id, isActive: true },
    ])
    .returning();
  console.log('  ✓ Rewards');

  // Loyalty transactions
  const pointsPerDollar = 10;
  const earn = (totalCents: number, orderId: string, customerId: string, description: string) => ({
    customerId,
    orderId,
    type: 'earn' as const,
    points: Math.floor((totalCents / 100) * pointsPerDollar),
    description,
  });

  await db.insert(loyaltyTransactions).values([
    // Alice — high spender, enough for a reward
    earn(order1.totalCents, order1.id, alice.id, `Order #${order1.id.slice(0, 8)} completed`),
    earn(order6.totalCents, order6.id, alice.id, `Order #${order6.id.slice(0, 8)} completed`),
    { customerId: alice.id, rewardId: freeDesert.id, type: 'redeem' as const, points: -500, description: 'Redeemed: Free Dessert' },
    { customerId: alice.id, type: 'adjustment' as const, points: 200, description: 'Welcome bonus' },

    // Bob
    earn(order2.totalCents, order2.id, bob.id, `Order #${order2.id.slice(0, 8)} completed`),
    earn(order7.totalCents, order7.id, bob.id, `Order #${order7.id.slice(0, 8)} completed`),

    // Carol
    earn(order7.totalCents, order7.id, carol.id, `Order #${order7.id.slice(0, 8)} completed`),

    // David
    earn(order4.totalCents, order4.id, david.id, `Order #${order4.id.slice(0, 8)} completed`),
    { customerId: david.id, type: 'adjustment' as const, points: 150, description: 'Birthday bonus' },

    // Emma
    earn(order5.totalCents, order5.id, emma.id, `Order #${order5.id.slice(0, 8)} completed`),
    { customerId: emma.id, rewardId: tenOff.id, type: 'redeem' as const, points: -800, description: 'Redeemed: $10 Off Your Bill' },
  ]);
  console.log('  ✓ Loyalty transactions');

  console.log('\n✅ Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
