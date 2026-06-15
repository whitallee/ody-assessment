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

  console.log('\n✅ Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
