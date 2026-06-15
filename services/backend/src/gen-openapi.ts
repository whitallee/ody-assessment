/**
 * Generates openapi.json from the Hono app without starting a server.
 * Run via: pnpm --filter @ody/backend gen:spec
 * Output goes to ./openapi.json (consumed by Orval in packages/api-client)
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';

process.env.DATABASE_URL = 'postgresql://mock';

void (async () => {
  const { default: app } = await import('./index.js');

  const spec = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: {
      title: 'Ody Restaurant API',
      version: '1.0.0',
      description: 'Backend API for the Ody restaurant operations dashboard',
    },
    servers: [
      { url: 'http://localhost:8787', description: 'Local development' },
      { url: 'https://ody-backend.YOUR_SUBDOMAIN.workers.dev', description: 'Production' },
    ],
  });

  const outPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(spec, null, 2));
  console.log(`✓ OpenAPI spec written to ${outPath}`);
})();
