import { defineConfig } from 'orval';

export default defineConfig({
  odyApi: {
    input: {
      target: '../../services/backend/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/generated/index.ts',
      client: 'react-query',
      httpClient: 'fetch',
      baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787',
      override: {
        mutator: {
          path: './src/fetcher.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
