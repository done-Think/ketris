import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Testes de integração (*.integration.test.ts) batem em Postgres real — rodam só via
    // `npm run test:integration` (vitest.integration.config.mts), nunca no `test`/`test:run` padrão.
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.d.ts', '**/*.config.*', 'src/test/**'],
    },
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
})
