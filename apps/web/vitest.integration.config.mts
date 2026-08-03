import path from 'node:path'
import { defineConfig, loadEnv } from 'vitest/config'

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
