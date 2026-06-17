import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { menuCategoriesRoutes } from './routes/menu-categories';
import { menuItemsRoutes } from './routes/menu-items';
import { ordersRoutes } from './routes/orders';
import { customersRoutes } from './routes/customers';
import { settingsRoutes } from './routes/settings';
import { homeRoutes } from './routes/home';
import { reservationsRoutes } from './routes/reservations';
import { rewardsRoutes } from './routes/rewards';
import { loyaltyRoutes } from './routes/loyalty';
import { createDb } from './db';

export type Env = {
  Bindings: {
    DATABASE_URL: string;
  };
  Variables: {
    db: ReturnType<typeof createDb>;
  };
};

const app = new OpenAPIHono<Env>();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));

app.use('*', async (c, next) => {
  c.set('db', createDb(c.env?.DATABASE_URL ?? ''));
  await next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route('/menu-categories', menuCategoriesRoutes);
app.route('/menu-items', menuItemsRoutes);
app.route('/orders', ordersRoutes);
app.route('/customers', customersRoutes);
app.route('/settings', settingsRoutes);
app.route('/home', homeRoutes);
app.route('/reservations', reservationsRoutes);
app.route('/rewards', rewardsRoutes);
app.route('/loyalty', loyaltyRoutes);

// ─── OpenAPI spec ─────────────────────────────────────────────────────────────

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Ody Restaurant API',
    version: '1.0.0',
    description: 'Backend API for the Ody restaurant operations dashboard',
  },
  servers: [{ url: 'http://localhost:8787', description: 'Local development' }],
});

app.get('/docs', swaggerUI({ url: '/openapi.json' }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
