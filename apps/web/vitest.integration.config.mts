import path from 'node:path'
import { defineConfig, loadEnv } from 'vitest/config'

// Config separada dos testes unitários (vitest.config.mts): ambiente 'node' (não jsdom — não há DOM
// aqui), sem os setup files de Testing Library, e carrega o .env real do projeto (DATABASE_URL,
// AUTH_TOKEN_SECRET) via loadEnv, já que estes testes batem no Postgres de verdade. Rodar com
// `npm run test:integration`, com `docker compose up -d` e as migrations aplicadas.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    test: {
      environment: 'node',
      globals: true,
      include: ['src/**/*.integration.test.ts'],
      env,
      testTimeout: 15_000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@config': path.resolve(__dirname, './src/config'),
        '@server': path.resolve(__dirname, './src/server'),
      },
    },
  }
})
